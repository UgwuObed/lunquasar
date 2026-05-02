import styles from "./Footer.module.css";

interface FooterProps { onTerminal: () => void; }

export default function Footer({ onTerminal }: FooterProps) {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div>
          <p className={styles.logo}>lunqausar</p>
          <p className={styles.sub}>built in Lagos, Nigeria · {new Date().getFullYear()}</p>
        </div>
        <div className={styles.links}>
          <a href="https://github.com/UgwuObed" target="_blank" rel="noopener noreferrer" className={styles.link}>GitHub</a>
          <a href="https://www.linkedin.com/in/obed-ugwu-81a568180/" target="_blank" rel="noopener noreferrer" className={styles.link}>LinkedIn</a>
          <a href="mailto:obedugwuv@gmail.com" className={styles.link}>Email</a>
          <button onClick={onTerminal} className={styles.termBtn}>
            ctrl+` → terminal
          </button>
        </div>
      </div>
    </footer>
  );
}
