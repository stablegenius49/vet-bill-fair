import styles from "./page.module.css";
import Link from "next/link";

export default function Home() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.logo}>Vet Bill Fair</div>
        <nav className={styles.nav}>
          <Link href="/upload">Start</Link>
          <Link href="/admin">Admin</Link>
        </nav>
      </header>

      <section className={styles.hero}>
        <div className={styles.heroCard}>
          <h1 className={styles.heroTitle}>
            Concierge support for unexpected vet bills.
          </h1>
          <p className={styles.heroCopy}>
            Upload your invoice once and let our team follow up with the right
            options. We keep things simple, secure, and fast.
          </p>
          <div className={styles.ctaRow}>
            <Link className={styles.primaryCta} href="/upload">
              Upload a bill
            </Link>
            <Link className={styles.secondaryCta} href="/success">
              How it works
            </Link>
          </div>
        </div>
        <div className={styles.steps}>
          <div className={styles.stepCard}>
            <div className={styles.stepTitle}>1. Upload</div>
            <p>Share your vet invoice securely in minutes.</p>
          </div>
          <div className={styles.stepCard}>
            <div className={styles.stepTitle}>2. Review</div>
            <p>We confirm the details and find the next best step.</p>
          </div>
          <div className={styles.stepCard}>
            <div className={styles.stepTitle}>3. Checkout</div>
            <p>Complete checkout when you are ready to proceed.</p>
          </div>
        </div>
      </section>

      <footer className={styles.footer}>
        <span>Built for quick, compassionate help.</span>
        <span>Need support? concierge@vetbillfair.com</span>
      </footer>
    </div>
  );
}
