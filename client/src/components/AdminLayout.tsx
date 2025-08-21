import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NavLink: React.FC<{ to: string; children: React.ReactNode }>=({ to, children })=>{
	const { pathname } = useLocation();
	const active = pathname === to;
	return (
		<Link
			to={to}
			className={
				`rounded px-3 py-2 text-sm font-medium transition-colors ${active ? 'bg-white/90 text-gray-900' : 'text-white/90 hover:bg-white/10 hover:text-white'}`
			}
		>
			{children}
		</Link>
	);
};

export const AdminLayout: React.FC<{ title?: string; children: React.ReactNode }>=({ title, children })=>{
	const { user, logout } = useAuth();
	return (
		<div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
			<header className="sticky top-0 z-30 border-b border-black/5 bg-gradient-to-r from-indigo-600 to-purple-600/90 backdrop-blur">
				<div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
					<div className="flex items-center gap-3">
						<Link to="/admin/metrics" className="text-lg font-semibold text-white">Smart Helpdesk Admin</Link>
						<nav className="hidden gap-1 sm:flex">
							<NavLink to="/admin/metrics">Dashboard</NavLink>
							<NavLink to="/admin/users">Users</NavLink>
							<NavLink to="/kb">KB</NavLink>
							<NavLink to="/admin/config">Settings</NavLink>
							<NavLink to="/agent">Agent</NavLink>
						</nav>
					</div>
					<div className="flex items-center gap-3">
						{user && (
							<div className="hidden items-center gap-3 sm:flex">
								<span className="rounded bg-white/10 px-2 py-1 text-xs text-white/90">{user.role}</span>
								<span className="text-sm text-white/90">{user.name}</span>
							</div>
						)}
						<button onClick={logout} className="rounded bg-white/90 px-3 py-2 text-sm font-medium text-gray-900 hover:bg-white">
							Logout
						</button>
					</div>
				</div>
			</header>
			<main className="mx-auto max-w-7xl px-4 py-8">
				{title && <h1 className="mb-6 text-2xl font-semibold text-gray-900">{title}</h1>}
				<div className="rounded-xl border border-gray-200 bg-white/90 p-4 shadow-sm sm:p-6">
					{children}
				</div>
			</main>
		</div>
	);
};

export default AdminLayout;


