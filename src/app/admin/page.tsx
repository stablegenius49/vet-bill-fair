import AdminTable from "./table";
import styles from "./admin.module.css";
import Link from "next/link";
import { Suspense } from "react";

export default function AdminPage() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link href="/">Vet Bill Fair</Link>
        <span>Admin Console</span>
      </header>
      <Suspense fallback={<div className={styles.card}>Loading…</div>}>
        <AdminTable />
      </Suspense>
    </div>
  );
}
