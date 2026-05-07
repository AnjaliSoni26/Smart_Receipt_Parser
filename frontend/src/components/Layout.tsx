import { Outlet, NavLink } from 'react-router-dom';

export default function Layout() {
  return (
    <>
      <header className="app-header">
        <h1>Receipt Parser</h1>
        <span className="subtitle">powered by Gemini</span>
        <nav className="app-nav">
          <NavLink to="/" end className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
            Upload
          </NavLink>
          <NavLink to="/receipts" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
            History
          </NavLink>
        </nav>
      </header>
      <main className="page">
        <Outlet />
      </main>
    </>
  );
}
