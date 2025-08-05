import Sidebar from '../../components/Sidebar';

export default function Dashboard() {
  return (
    <div className="d-flex">
      <Sidebar />
      <div className="p-4" style={{ width: '100%' }}>
        <h1>Tableau de bord</h1>
        <p>Bienvenue sur le tableau de bord.</p>
      </div>
    </div>
  );
}
