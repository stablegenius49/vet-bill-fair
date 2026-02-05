import UploadForm from "./upload-form";
import styles from "./upload.module.css";
import Link from "next/link";
import { Suspense } from "react";

export default function UploadPage() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link href="/">Vet Bill Fair</Link>
      </header>
      <Suspense fallback={<div className={styles.form}>Loading…</div>}>
        <UploadForm />
      </Suspense>
    </div>
  );
}
