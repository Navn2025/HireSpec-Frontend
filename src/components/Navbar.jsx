import {useState} from 'react';
import {useLocation, Link} from 'react-router-dom';
import {useAuth} from '../contexts/AuthContext';
import
{
    TargetIcon,
    DumbbellIcon,
    RobotIcon,
    ChatIcon,
    CodeIcon,
    DashboardIcon,
    UsersIcon,
    HomeIcon,
    MenuIcon,
    CloseIcon,
    UserIcon,
} from './Icons';

function Navbar()
{
    const [mobileMenuOpen, setMobileMenuOpen]=useState(false);
    const location=useLocation();
    const {isAuthenticated, user, logout}=useAuth();

    // Check if user is a recruiter/admin
    const isRecruiter=user?.role==='admin'||user?.role==='company_admin'||user?.role==='company_hr';

    const isActive=(path) =>
    {
        if (path==='/')
        {
            return location.pathname==='/';
        }
        return location.pathname.startsWith(path);
    };

    return (
        <nav className="navbar">
            <div className="navbar-content">
                <a href="/" className="logo">
                    <TargetIcon size={28} />
                    <span>HireSpec</span>
                </a>
                <button
                    className="mobile-menu-btn"
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                >
                    {mobileMenuOpen? <CloseIcon size={24} />:<MenuIcon size={24} />}
                </button>
                <div className={`nav-links ${mobileMenuOpen? 'open':''}`}>
                    <a href="/" className={`nav-link ${isActive('/')? 'active':''}`}>
                        <HomeIcon size={18} />
                        <span>Home</span>
                    </a>
                    <a href="/practice-setup" className={`nav-link ${isActive('/practice')? 'active':''}`}>
                        <DumbbellIcon size={18} />
                        <span>Practice</span>
                    </a>
                    <a href="/ai-interview-setup" className={`nav-link ${isActive('/ai-interview')? 'active':''}`}>
                        <RobotIcon size={18} />
                        <span>AI Interview</span>
                    </a>
                    <a href="/axiom-chat" className={`nav-link ${isActive('/axiom-chat')? 'active':''}`}>
                        <ChatIcon size={18} />
                        <span>Axiom AI</span>
                    </a>
                    <a href="/coding-practice" className={`nav-link ${isActive('/coding-practice')? 'active':''}`}>
                        <CodeIcon size={18} />
                        <span>Coding</span>
                    </a>
                    {isAuthenticated && (
                        <>
                            <a href="/leaderboard" className={`nav-link ${isActive('/leaderboard')? 'active':''}`}>
                                <TargetIcon size={18} />
                                <span>Leaderboard</span>
                            </a>
                            <a href="/contests" className={`nav-link ${isActive('/contests')? 'active':''}`}>
                                <DumbbellIcon size={18} />
                                <span>Contests</span>
                            </a>
                        </>
                    )}
                    {isRecruiter&&(
                        <>
                            <a href="/proctor-dashboard" className={`nav-link proctor-link ${isActive('/proctor-dashboard')? 'active':''}`}>
                                <DashboardIcon size={18} />
                                <span>Proctor</span>
                            </a>
                            <a href="/recruiter-dashboard" className={`nav-link proctor-link ${isActive('/recruiter-dashboard')? 'active':''}`}>
                                <UsersIcon size={18} />
                                <span>Recruiter</span>
                            </a>
                        </>
                    )}

                    {/* Auth Buttons */}
                    <div className="nav-auth-section">
                        {isAuthenticated? (
                            <div className="nav-user-menu">
                                <span className="nav-user-name">
                                    <UserIcon size={18} />
                                    {user?.full_name||user?.username||'User'}
                                </span>
                                <button onClick={logout} className="nav-logout-btn">
                                    Logout
                                </button>
                            </div>
                        ):(
                            <div className="nav-auth-buttons">
                                <Link to="/login" className="nav-auth-btn nav-login-btn">
                                    Login
                                </Link>
                                <Link to="/register" className="nav-auth-btn nav-signup-btn">
                                    Sign Up
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}

export default Navbar;
