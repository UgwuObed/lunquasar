import React from "react";

export type PostMeta = {
  slug: string;
  title: string;
  date: string;
  mins: string;
  tag: string;
  col: string;
  excerpt: string;
};

export type FullPost = PostMeta & {
  Content: () => React.ReactElement;
};

function TokenScreenerPost() {
  return (
    <>
      <p>
        Token Radar started as a personal tool. I kept missing early-stage token launches on Base.
        By the time they hit Twitter or Telegram groups, the move had already happened. I wanted
        a feed that showed me new pairs the moment liquidity was added, before any social signal.
      </p>
      <p>
        The naive approach is to poll an RPC node. Make a call every few seconds, diff the
        results. I tried this for about a week. At low polling frequency you miss events entirely.
        At high frequency you burn through your RPC quota in hours and the node provider starts
        throttling you. There had to be a better way.
      </p>

      <h2>Why Goldsky Mirror</h2>
      <p>
        Goldsky builds infrastructure for blockchain data. They have two products worth knowing
        about: <strong>Subgraphs</strong> and <strong>Mirror</strong>.
      </p>
      <p>
        Subgraphs give you a GraphQL API over indexed contract events. You define the events you
        care about in a manifest, they index the chain and expose a queryable API. This is what
        most DeFi dashboards use.
      </p>
      <p>
        Mirror is different. Instead of querying their API, Mirror <em>pushes</em> on-chain data
        into your own infrastructure: PostgreSQL, Kafka, a webhook, whatever you configure. You
        define a pipeline YAML, point it at a contract and event signature, and events start
        landing in your database in near real-time.
      </p>
      <p>
        For Token Radar, Mirror was the right call. I wanted the data in my own database so I
        could run arbitrary SQL, join against other tables, and own the latency.
      </p>

      <h2>The architecture</h2>
      <pre><code>{`Base RPC -> Goldsky Mirror -> PostgreSQL
                                  |
                         Node.js service (pg_notify)
                                  |
                         WebSocket (ws)
                                  |
                         Browser client`}</code></pre>
      <p>
        Goldsky Mirror handles the hard part: maintaining a connection to a Base archive node,
        replaying blocks, decoding ABI-encoded event logs, and writing rows into PostgreSQL
        reliably. My Node.js service doesn't touch the chain at all. It just listens to the
        database.
      </p>

      <h2>Setting up the pipeline</h2>
      <p>
        A Goldsky Mirror pipeline is defined in a YAML file. You specify the chain, the contract
        address, the ABI, which events to capture, and where to write the data. Here's a
        simplified version of what I use to capture Uniswap V2{" "}
        <code>PairCreated</code> events on Base:
      </p>
      <pre><code>{`sources:
  - name: base_pairs
    type: ethereum
    network: base
    abi: ./abis/UniswapV2Factory.json
    events:
      - PairCreated(address,address,address,uint256)
    start_block: 0

transforms:
  - name: pairs_transform
    type: sql
    sql: |
      SELECT
        block_number,
        block_timestamp,
        transaction_hash,
        log_index,
        token0,
        token1,
        pair,
        all_pairs_length
      FROM base_pairs

sinks:
  - name: postgres_sink
    type: postgresql
    connection: \${GOLDSKY_PG_URL}
    table: token_pairs
    schema: public
    transform: pairs_transform`}</code></pre>
      <p>
        You deploy this with <code>goldsky pipeline create token-radar.yaml</code>. After a
        backfill period (which for Base was a few hours the first time), events start landing
        in the <code>token_pairs</code> table continuously.
      </p>

      <h2>Listening for new rows</h2>
      <p>
        PostgreSQL has a built-in pub/sub mechanism called <code>LISTEN</code> /{" "}
        <code>NOTIFY</code>. I created a trigger that fires on every new row in{" "}
        <code>token_pairs</code> and sends a notification to a channel:
      </p>
      <pre><code>{`CREATE OR REPLACE FUNCTION notify_new_pair()
RETURNS trigger AS $$
BEGIN
  PERFORM pg_notify(
    'new_pair',
    row_to_json(NEW)::text
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER token_pairs_notify
AFTER INSERT ON token_pairs
FOR EACH ROW EXECUTE FUNCTION notify_new_pair();`}</code></pre>
      <p>
        In Node.js, I keep a single long-lived connection that listens on this channel. When a
        notification arrives, I broadcast it to all connected WebSocket clients:
      </p>
      <pre><code>{`import { Client } from "pg";
import { WebSocketServer } from "ws";

const pgClient = new Client({ connectionString: process.env.DATABASE_URL });
const wss = new WebSocketServer({ port: 8080 });

await pgClient.connect();
await pgClient.query("LISTEN new_pair");

pgClient.on("notification", (msg) => {
  const pair = JSON.parse(msg.payload ?? "{}");
  const broadcast = JSON.stringify({ type: "new_pair", data: pair });

  wss.clients.forEach((client) => {
    if (client.readyState === client.OPEN) {
      client.send(broadcast);
    }
  });
});`}</code></pre>

      <h2>The deduplication problem</h2>
      <p>
        Here's the thing nobody warns you about with blockchain data pipelines: events can
        arrive more than once.
      </p>
      <p>
        Chain reorganizations happen. A block gets reorganized out of the canonical chain and
        Goldsky replays it. If you're not handling this, you'll insert duplicate rows. Depending
        on your downstream logic, this can mean double notifications, double records, or
        (in financial contexts) double credits.
      </p>
      <p>
        The fix is a composite unique constraint on the natural key of the event:
      </p>
      <pre><code>{`ALTER TABLE token_pairs
ADD CONSTRAINT uq_token_pairs_event
UNIQUE (transaction_hash, log_index);`}</code></pre>
      <p>
        Then in your insert logic (or in Goldsky's pipeline config if it supports it), use{" "}
        <code>ON CONFLICT DO NOTHING</code>. Goldsky Mirror supports an{" "}
        <code>on_conflict</code> directive in the sink config. Set it and sleep well.
      </p>

      <h2>Schema for token metadata</h2>
      <p>
        Raw pair events give you token addresses, not names or symbols. I run a second process
        that picks up new pairs, calls the token contract's ERC-20 <code>symbol()</code> and{" "}
        <code>decimals()</code> via a public Base RPC, and writes the metadata into a{" "}
        <code>tokens</code> table. This is where RPC polling is actually fine. It's a small
        number of targeted calls, not a streaming subscription.
      </p>
      <pre><code>{`CREATE TABLE tokens (
  address       TEXT PRIMARY KEY,
  symbol        TEXT,
  name          TEXT,
  decimals      SMALLINT,
  fetched_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE token_pairs (
  id                BIGSERIAL PRIMARY KEY,
  block_number      BIGINT NOT NULL,
  block_timestamp   TIMESTAMPTZ NOT NULL,
  transaction_hash  TEXT NOT NULL,
  log_index         INTEGER NOT NULL,
  token0            TEXT REFERENCES tokens(address),
  token1            TEXT REFERENCES tokens(address),
  pair              TEXT NOT NULL,
  all_pairs_length  BIGINT,
  UNIQUE(transaction_hash, log_index)
);`}</code></pre>

      <h2>What I'd do differently</h2>
      <p>
        The <code>pg_notify</code> payload is limited to 8000 bytes. For most events this is
        fine, but if you're capturing events with large calldata or many indexed fields, you'll
        hit this limit. The safer pattern is to notify with just the row ID and have the
        WebSocket server fetch the full row separately.
      </p>
      <p>
        I'd also add a Redis pub/sub layer between PostgreSQL and the WebSocket server if I were
        scaling horizontally. Right now the Node.js process is a single instance, which is fine
        for a personal tool but not for production with multiple replicas.
      </p>
      <p>
        Goldsky's pricing is usage-based and the free tier is enough to get started. For a
        side project on a single chain, you won't pay anything meaningful. For a production
        multi-chain screener, budget it in.
      </p>
    </>
  );
}

function NigeriaPaymentsPost() {
  return (
    <>
      <p>
        I've integrated Nigerian payment rails into production systems more times than I can
        count at this point. Each time I thought the docs would be enough. Each time, I was
        wrong about something that cost me hours, usually at the worst possible moment.
      </p>
      <p>
        This post covers the three providers I've actually shipped: Paystack, VFD Microfinance
        Bank, and Polar.sh. Not a comparison, not a tutorial. Just the things that aren't in
        the docs, the edge cases that burn you in prod, and the architecture decisions I've made
        because of them.
      </p>

      <h2>Paystack</h2>
      <p>
        Paystack is the default starting point for Nigerian SaaS. The documentation is
        genuinely good, better than most payment providers globally. But there are gaps.
      </p>

      <h3>Subaccounts and split payments</h3>
      <p>
        If you're building a marketplace, you'll use Paystack's subaccount system. The flow
        is: create a subaccount per vendor, reference the subaccount ID on a charge, and
        Paystack automatically splits the settlement.
      </p>
      <p>
        What the docs don't make obvious: <strong>the split is based on settlement, not on
        the charge itself</strong>. The full amount hits your main account first, then Paystack
        settles to the subaccount on their schedule (typically T+1 for Nigerian bank accounts).
        If you're building a wallet system where funds need to be available immediately after
        payment, subaccounts alone won't give you that. You'll need to combine them with
        Paystack Transfers.
      </p>

      <h3>Webhook retry behavior</h3>
      <p>
        Paystack retries webhooks if your endpoint doesn't return a 200 within a few seconds.
        The retry interval increases exponentially. What nobody documents clearly:{" "}
        <strong>Paystack does not deduplicate on their end</strong>. If your endpoint is slow,
        times out, or throws a 500, you will receive the same event multiple times.
      </p>
      <p>
        This is where idempotency matters (I cover this in a separate post). Specifically for
        Paystack: use the <code>reference</code> field as your idempotency key, not the
        transaction ID. References are user-controlled and stable across retries. Transaction
        IDs change if a payment is re-initiated.
      </p>
      <pre><code>{`// Verify the event is genuine before processing
app.post("/webhook/paystack", async (req, res) => {
  const hash = crypto
    .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY!)
    .update(JSON.stringify(req.body))
    .digest("hex");

  if (hash !== req.headers["x-paystack-signature"]) {
    return res.sendStatus(401);
  }

  // Respond IMMEDIATELY before any async work
  res.sendStatus(200);

  const { event, data } = req.body;

  if (event === "charge.success") {
    await processPayment(data.reference, data.amount);
  }
});`}</code></pre>
      <p>
        The key pattern: respond with 200 before you do any async work. If your DB call takes
        3 seconds and Paystack's timeout is 5 seconds, you're gambling. Acknowledge first,
        process after.
      </p>

      <h3>Virtual accounts and the expiry problem</h3>
      <p>
        Paystack's Dedicated Virtual Accounts (DVA) let you assign a permanent bank account
        number to each customer. Payments to that account route back to your platform.
      </p>
      <p>
        The gotcha: DVAs are only available on specific Paystack plans, and the account numbers
        are sourced from partner banks (Wema, Sterling, etc.). Different banks have different
        settlement speeds and different failure modes. I've seen Wema DVA payments take up to
        48 hours to reflect during bank system outages. Build timeout handling into your UX.
      </p>

      <h2>VFD Microfinance Bank</h2>
      <p>
        VFD is a microfinance bank in Nigeria with a developer API. I integrated it at Wano for
        wallet funding, inter-bank transfers, and balance queries. The API is functional but
        the documentation has gaps.
      </p>

      <h3>Authentication flow</h3>
      <p>
        VFD uses a token-based auth where your client credentials exchange for a short-lived
        access token. The token expiry is not documented with precision. In practice it's
        around 30 minutes, but I've seen it expire in under 10 during high-load periods.
      </p>
      <p>
        The only safe approach is to catch auth errors in your request wrapper and re-authenticate
        on any 401:
      </p>
      <pre><code>{`class VFDClient {
  private token: string | null = null;
  private tokenExpiry: number = 0;

  private async getToken(): Promise<string> {
    if (this.token && Date.now() < this.tokenExpiry - 60_000) {
      return this.token;
    }

    const res = await fetch(\`\${VFD_BASE_URL}/auth/token\`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: process.env.VFD_CLIENT_ID,
        client_secret: process.env.VFD_CLIENT_SECRET,
        grant_type: "client_credentials",
      }),
    });

    const data = await res.json();
    this.token = data.access_token;
    // Treat token as valid for 25 min regardless of stated expiry
    this.tokenExpiry = Date.now() + 25 * 60 * 1000;
    return this.token!;
  }

  async request(path: string, body: object) {
    const token = await this.getToken();
    const res = await fetch(\`\${VFD_BASE_URL}\${path}\`, {
      method: "POST",
      headers: {
        Authorization: \`Bearer \${token}\`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (res.status === 401) {
      this.token = null; // Force re-auth on next request
      throw new Error("VFD auth failed, will retry");
    }

    return res.json();
  }
}`}</code></pre>

      <h3>Transfer status polling</h3>
      <p>
        VFD's transfer API is asynchronous. You initiate a transfer and get a reference back,
        but the actual status (success, failed, pending) only becomes available via a status
        query endpoint. There's no webhook system as of the time I integrated.
      </p>
      <p>
        This means you need a polling job. I used Bull (now BullMQ) with exponential backoff:
        check after 30s, then 2m, then 5m, then 15m. After 30 minutes with no success, mark
        as failed and trigger a manual review queue. Don't leave "pending" transfers in limbo
        forever. They'll become a customer support nightmare.
      </p>

      <h2>Polar.sh</h2>
      <p>
        Polar.sh is a payments layer for developers, primarily aimed at open-source
        monetization. I use it at SongDis for international artist payouts and for handling
        subscription billing from non-Nigerian customers.
      </p>
      <p>
        The Nigerian payment ecosystem is largely domestic. Paystack can process international
        cards but the settlement is in naira unless you have specific CBN approvals. For a
        music distribution platform where artists need USD/EUR payouts to international
        accounts, Polar.sh fills a gap Paystack doesn't.
      </p>

      <h3>What it's good for</h3>
      <p>
        Polar handles subscription billing, one-time purchases, and revenue share between
        accounts natively. The API is clean and the webhook events are well-documented. If
        you're building any kind of creator economy product with international customers,
        it's worth evaluating.
      </p>

      <h3>The CBN angle</h3>
      <p>
        Nigerian companies receiving international payments face CBN (Central Bank of Nigeria)
        foreign exchange regulations. Funds received in foreign currency must be repatriated
        within certain windows. If you're building a product that handles cross-border money
        movement, get proper legal advice before choosing a provider. This is not something
        you figure out in production.
      </p>

      <h2>The pattern I use across all three</h2>
      <p>
        Regardless of provider, every payment integration I build now has the same structure:
      </p>
      <ol>
        <li>
          <strong>Idempotent processing.</strong> Every webhook event is processed exactly once,
          keyed on the provider's reference or event ID.
        </li>
        <li>
          <strong>Immediate acknowledgement.</strong> Respond 200 to webhooks before doing any
          async work. Queue the processing.
        </li>
        <li>
          <strong>Audit log.</strong> Every payment event writes to an append-only ledger table,
          regardless of whether it changes application state. When something goes wrong at 2am,
          you want a full history.
        </li>
        <li>
          <strong>Manual review queue.</strong> Anything that fails processing after retries goes
          into a queue for human review, not into a silent failure state.
        </li>
      </ol>
      <p>
        Payment systems will fail in ways you didn't anticipate. The question is whether your
        system degrades gracefully or silently.
      </p>
    </>
  );
}

function IdempotentTransactionsPost() {
  return (
    <>
      <p>
        A user called me on a Saturday afternoon. His wallet had been debited twice. Same
        amount, two separate transactions, two minutes apart. He was angry, reasonably so.
      </p>
      <p>
        I looked at the logs. Paystack had fired the webhook. Our server had processed it, but
        the response took 6 seconds, just over our connection timeout. Paystack assumed we
        hadn't received it and fired the webhook again. Our server processed it again. Two
        credits. One payment.
      </p>
      <p>
        That was the last time I built a payment system without explicit idempotency
        guarantees.
      </p>

      <h2>What idempotency means</h2>
      <p>
        An operation is idempotent if applying it multiple times produces the same result as
        applying it once. In HTTP terms, GET is naturally idempotent. POST is not, so we have
        to engineer idempotency explicitly into financial write operations.
      </p>
      <p>
        The mechanism is simple: assign a unique key to each logical operation. Before executing
        the operation, check if a record with that key already exists. If it does, return the
        existing result without re-executing. If it doesn't, execute and store the result keyed
        by that ID.
      </p>

      <h2>Database-level idempotency</h2>
      <p>
        The most reliable place to enforce idempotency is the database, not application code.
        Application code has race conditions. The database can enforce uniqueness atomically.
      </p>
      <pre><code>{`CREATE TABLE wallet_credits (
  id               BIGSERIAL PRIMARY KEY,
  idempotency_key  TEXT NOT NULL,
  user_id          UUID NOT NULL,
  amount           NUMERIC(15, 2) NOT NULL,
  currency         TEXT NOT NULL DEFAULT 'NGN',
  source           TEXT NOT NULL,        -- 'paystack', 'vfd', etc.
  source_reference TEXT NOT NULL,
  status           TEXT NOT NULL DEFAULT 'pending',
  processed_at     TIMESTAMPTZ,
  created_at       TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT uq_wallet_credits_idempotency
    UNIQUE (idempotency_key)
);`}</code></pre>
      <p>
        The <code>UNIQUE</code> constraint on <code>idempotency_key</code> is the core
        guarantee. No matter how many times a webhook fires, only one row can exist for a
        given key. Every subsequent attempt to insert will fail at the database level.
      </p>

      <h2>Choosing the right key</h2>
      <p>
        The idempotency key needs to be stable across retries. For Paystack webhooks, I use
        the <code>reference</code> field, which is set when the transaction is initiated and
        doesn't change on retry. For VFD transfers, I use the transaction reference the
        initiating request returns.
      </p>
      <p>
        For operations you initiate (e.g., you're sending a payout), generate the key before
        the request, store it, and include it in the API call. Most payment providers accept
        an idempotency key header:
      </p>
      <pre><code>{`const idempotencyKey = \`payout-\${payoutId}-\${Date.now()}\`;

const response = await fetch("https://api.paystack.co/transfer", {
  method: "POST",
  headers: {
    Authorization: \`Bearer \${process.env.PAYSTACK_SECRET_KEY}\`,
    "Idempotency-Key": idempotencyKey,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    source: "balance",
    amount: amountInKobo,
    recipient: recipientCode,
    reason: "Artist payout",
  }),
});`}</code></pre>
      <p>
        Paystack will return the same response for any subsequent request with the same
        idempotency key within 24 hours, without re-executing the transfer.
      </p>

      <h2>The processing pattern</h2>
      <p>
        Here's the pattern I use for every incoming webhook event:
      </p>
      <pre><code>{`async function processPaystackWebhook(
  reference: string,
  amount: number,
  userId: string
): Promise<void> {
  const idempotencyKey = \`paystack:\${reference}\`;

  // Attempt to insert, fails silently if duplicate
  const result = await db.query<{ id: number }>(
    \`INSERT INTO wallet_credits
       (idempotency_key, user_id, amount, source, source_reference)
     VALUES ($1, $2, $3, 'paystack', $4)
     ON CONFLICT (idempotency_key) DO NOTHING
     RETURNING id\`,
    [idempotencyKey, userId, amount / 100, reference]
  );

  // No rows returned means this was a duplicate, stop here
  if (result.rows.length === 0) {
    logger.info({ reference }, "Duplicate webhook, skipping");
    return;
  }

  const creditId = result.rows[0].id;

  // Now execute the actual state change
  await db.transaction(async (trx) => {
    await trx.query(
      "UPDATE wallets SET balance = balance + $1 WHERE user_id = $2",
      [amount / 100, userId]
    );

    await trx.query(
      "UPDATE wallet_credits SET status = 'completed', processed_at = NOW() WHERE id = $1",
      [creditId]
    );
  });
}`}</code></pre>
      <p>
        The <code>ON CONFLICT DO NOTHING</code> clause does the heavy lifting.
        If the idempotency key already exists, no row is returned, and we return early. The
        user's wallet is never touched a second time.
      </p>

      <h2>Handling the in-flight case</h2>
      <p>
        There's a subtler problem: what if the first request is still processing when the
        second one arrives? The unique constraint handles the insert-level race, but you might
        have two goroutines/workers both past the INSERT and running the UPDATE.
      </p>
      <p>
        The answer is a database-level lock on the row. After the INSERT, before the UPDATE:
      </p>
      <pre><code>{`await trx.query(
  "SELECT id FROM wallet_credits WHERE id = $1 FOR UPDATE",
  [creditId]
);`}</code></pre>
      <p>
        <code>FOR UPDATE</code> acquires a row-level lock. Any other transaction trying to
        acquire the same lock will wait. This turns a potential race condition into a
        sequential queue. The second worker will wait, then find the row already marked
        "completed", and can exit without doing anything.
      </p>

      <h2>Testing it</h2>
      <p>
        Write a test that fires the same webhook payload twice concurrently and asserts that
        the wallet balance only increases once:
      </p>
      <pre><code>{`it("processes duplicate webhooks exactly once", async () => {
  const userId = await createTestUser({ balance: 0 });
  const reference = "test_ref_" + Date.now();

  await Promise.all([
    processPaystackWebhook(reference, 10_000, userId),
    processPaystackWebhook(reference, 10_000, userId),
  ]);

  const wallet = await getWallet(userId);
  expect(wallet.balance).toBe(100); // 10,000 kobo = 100 NGN, credited once
});`}</code></pre>
      <p>
        If this test passes under concurrent execution, your idempotency implementation is
        solid. Run it a few times; race conditions are probabilistic.
      </p>

      <h2>The summary</h2>
      <p>
        Every financial write operation should have an idempotency key. Put the unique
        constraint in the database, not just in application logic. Acknowledge webhooks
        immediately and process asynchronously. Use <code>ON CONFLICT DO NOTHING</code> as
        your first line of defense and <code>FOR UPDATE</code> locks as your second.
      </p>
      <p>
        The user from the Saturday call got his refund. I never got another double-charge
        report after implementing this pattern across the platform.
      </p>
    </>
  );
}

function ColdFusionPost() {
  return (
    <>
      <p>
        My first production codebase was written in ColdFusion. Not a framework built on top
        of ColdFusion: raw CFML, running on a ColdFusion Application Server, talking to a
        Microsoft SQL Server database, deployed on a Windows Server 2012 box in a Lagos data
        center. This was 2019.
      </p>
      <p>
        I didn't know it was unusual. It was just the codebase I inherited when I joined
        IntelYtics. I learned to read it, fix bugs in it, and eventually extend it. By the
        time I left, we had moved significant portions of it to Node.js microservices.
      </p>
      <p>
        Here's what that taught me, about ColdFusion, about migrations, and about the
        decisions I'd make differently if I were starting over.
      </p>

      <h2>What ColdFusion actually is</h2>
      <p>
        ColdFusion is a server-side scripting language and platform developed by Adobe (now
        also maintained by Lucee as an open-source alternative). It was popular in the late
        1990s and 2000s for building web applications, before PHP dominated, before Node.js
        existed, before Rails was a thing.
      </p>
      <p>
        It's tag-based in its classic form, similar to JSP or ASP. A simple database query
        looks like this:
      </p>
      <pre><code>{`<cfquery name="getUsers" datasource="myDB">
  SELECT id, name, email
  FROM users
  WHERE active = 1
</cfquery>

<cfoutput query="getUsers">
  <p>#name#, #email#</p>
</cfoutput>`}</code></pre>
      <p>
        It's verbose. It mixes SQL, HTML, and business logic in ways that make modern
        developers physically recoil. But it <em>works</em>. The system I inherited had been
        running in production for nine years, processing real transactions, with zero
        unplanned downtime in the period I observed it. That's not nothing.
      </p>

      <h2>What ColdFusion got right</h2>
      <p>
        Working in that codebase taught me to appreciate things I've since had to re-engineer
        in Node.js:
      </p>
      <p>
        <strong>Session management was built in.</strong> ColdFusion's session scope was
        server-managed and persistent. No manual token generation, no JWT libraries, no Redis
        session store. You set a variable in the session scope and it was there on the next
        request. It wasn't sophisticated, but it worked.
      </p>
      <p>
        <strong>Database integration was first-class.</strong> CFML's <code>cfquery</code> tag
        handled connection pooling, parameterization, and result mapping automatically.
        In 2019 Node.js, I was setting up <code>pg</code> pools manually, writing my own
        query builders, and debugging connection leak issues. ColdFusion had solved this in
        the late 1990s.
      </p>
      <p>
        <strong>The runtime was stable.</strong> ColdFusion Application Server had been
        running that codebase for nearly a decade. The error handling was predictable.
        The performance characteristics were well-understood. Nobody was surprised by
        unexpected behavior.
      </p>

      <h2>Why we migrated</h2>
      <p>
        Not because ColdFusion was failing. The reasons were more mundane:
      </p>
      <ul>
        <li>
          <strong>Hiring.</strong> Finding developers who could read and write CFML in Lagos
          in 2020 was close to impossible. Node.js developers were abundant.
        </li>
        <li>
          <strong>Ecosystem.</strong> Every third-party integration we needed had a Node.js
          SDK. ColdFusion required custom HTTP clients for everything.
        </li>
        <li>
          <strong>Scalability model.</strong> ColdFusion's threading model doesn't map cleanly
          to horizontal scaling. Node.js's event loop does.
        </li>
        <li>
          <strong>New features.</strong> Building new features in ColdFusion felt like working
          against gravity. The same feature in Node.js with TypeScript took a third of the time.
        </li>
      </ul>

      <h2>The migration strategy</h2>
      <p>
        We didn't rewrite. Every time I've seen a team decide to "rewrite from scratch in the
        new stack," it ends the same way: the rewrite takes three times as long as estimated,
        the business logic from the original system is only half-understood, and you spend
        months debugging regressions that didn't exist in the old system.
      </p>
      <p>
        We used the strangler fig pattern. The ColdFusion application continued to handle all
        existing routes. We introduced an Nginx layer in front of it. New features were built
        as Node.js services behind the same domain. Nginx routed by path: new paths went to
        Node.js, existing paths went to ColdFusion.
      </p>
      <pre><code>{`# nginx.conf (simplified)
location /api/v2/ {
    proxy_pass http://nodejs-service:3000;
}

location / {
    proxy_pass http://coldfusion-app:8500;
}`}</code></pre>
      <p>
        Over 14 months, we migrated modules one by one. When a ColdFusion module was
        migrated, we flipped the Nginx config for that path and removed the CFML code.
        The ColdFusion server kept running throughout. It just handled fewer routes each
        quarter.
      </p>

      <h2>What surprised me</h2>
      <p>
        The old codebase had business logic embedded in unexpected places. A ColdFusion
        tag that looked like a simple database query would have a conditional hidden in the
        SQL that encoded a critical business rule. We missed two of these during migration
        and both caused production bugs.
      </p>
      <p>
        The lesson: before you migrate any module, read every line of the original. Not to
        understand what it does, but to find the business rules hiding in the implementation
        details.
      </p>

      <h2>What I'd do differently</h2>
      <p>
        I'd write more characterization tests before touching anything. Capture the existing
        behavior (inputs and outputs) as test cases. Not unit tests, not integration tests
        in the Node.js sense. Just: "given this request, the system returns this response."
        Use those as a regression harness when the new system replaces the old.
      </p>
      <p>
        I'd also resist the urge to microservices immediately. We went from one ColdFusion
        monolith to six Node.js services in 14 months. Six services, six deployment
        pipelines, six sets of logs to debug when something broke. The strangler fig pattern
        worked. The microservices proliferation was a separate decision that didn't need to
        happen at the same time.
      </p>
      <p>
        Monolith first. Microservices when you have an actual scaling or team-boundary reason,
        not because microservices are the contemporary default.
      </p>

      <h2>The honest summary</h2>
      <p>
        ColdFusion taught me that software doesn't have to be modern to be correct. A
        nine-year-old system processing transactions reliably every day is worth more than
        a shiny microservices architecture that's been in production for three months. Respect
        the system that works before you replace it. Understand it before you migrate it.
        And never rewrite when you can strangle.
      </p>
    </>
  );
}

export const allPosts: FullPost[] = [
  {
    slug: "token-screener-base-goldsky",
    title: "Building a real-time token screener on Base with Goldsky pipelines",
    date: "Apr 2026",
    mins: "8 min",
    tag: "crypto",
    col: "#F0B429",
    excerpt:
      "How I built Token Radar: streaming live on-chain events from Base into PostgreSQL with Goldsky Mirror, then pushing updates to the browser over WebSockets, and the deduplication gotchas nobody warns you about.",
    Content: TokenScreenerPost,
  },
  {
    slug: "nigeria-payment-integrations",
    title:
      "Payment integrations in Nigeria: Paystack, VFD, Polar.sh, and what nobody documents",
    date: "Mar 2026",
    mins: "12 min",
    tag: "fintech",
    col: "#00e07a",
    excerpt:
      "Years of integrating Nigerian payment rails in production. The stuff that's in the docs, the stuff that isn't, and the things you only learn when a webhook fires at 2am and a customer is missing money.",
    Content: NigeriaPaymentsPost,
  },
  {
    slug: "idempotent-transactions",
    title: "Idempotent transaction design: how to never double-charge a user",
    date: "Feb 2026",
    mins: "10 min",
    tag: "backend",
    col: "#7b8cff",
    excerpt:
      "A payment webhook fired twice. The user got charged twice. Here's the database-level pattern I now use on every financial system so it can never happen again.",
    Content: IdempotentTransactionsPost,
  },
  {
    slug: "coldFusion-to-nodejs",
    title: "From enterprise ColdFusion to Node.js microservices: what I learned",
    date: "Jan 2026",
    mins: "7 min",
    tag: "career",
    col: "#ff8c69",
    excerpt:
      "My first production codebase was ColdFusion. Here's what that taught me about server-side rendering, session design, and why the strangler fig pattern beats every rewrite I've ever seen attempted.",
    Content: ColdFusionPost,
  },
];

export const postMap: Record<string, FullPost> = Object.fromEntries(
  allPosts.map((p) => [p.slug, p])
);
