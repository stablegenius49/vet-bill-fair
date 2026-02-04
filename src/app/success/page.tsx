import Link from "next/link";
import styles from "./success.module.css";

export default function SuccessPage() {
  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h1>Payment received</h1>
        <p>
          Thank you! Our concierge team will review your invoice and reach out
          shortly.
        </p>
        <Link className={styles.link} href="/">
          Back to home
        </Link>
      </div>
    </div>
  );
}
