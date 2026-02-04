import UploadForm from "./upload-form";
import styles from "./upload.module.css";
import Link from "next/link";

export default function UploadPage() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link href="/">Vet Bill Fair</Link>
      </header>
      <UploadForm />
    </div>
  );
}
