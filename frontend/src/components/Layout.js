import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Outlet, NavLink } from 'react-router-dom';
export default function Layout() {
    return (_jsxs(_Fragment, { children: [_jsxs("header", { className: "app-header", children: [_jsx("h1", { children: "Receipt Parser" }), _jsx("span", { className: "subtitle", children: "powered by Gemini" }), _jsxs("nav", { className: "app-nav", children: [_jsx(NavLink, { to: "/", end: true, className: ({ isActive }) => `nav-link${isActive ? ' active' : ''}`, children: "Upload" }), _jsx(NavLink, { to: "/receipts", className: ({ isActive }) => `nav-link${isActive ? ' active' : ''}`, children: "History" })] })] }), _jsx("main", { className: "page", children: _jsx(Outlet, {}) })] }));
}
