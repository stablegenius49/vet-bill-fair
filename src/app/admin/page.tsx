import AdminTable from "./table";
import styles from "./admin.module.css";
import Link from "next/link";

export default function AdminPage() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link href="/">Vet Bill Fair</Link>
        <span>Admin Console</span>
      </header>
      <AdminTable />
    </div>
  );
}
