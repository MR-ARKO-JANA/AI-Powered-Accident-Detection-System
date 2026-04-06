import { Link } from "react-router-dom";

function Navbar() {
    return (
        <header style={styles.container}>

            {/* Left - Logo/Title */}
            <div style={styles.left}>
                🚑 Accident Detection System
            </div>

            {/* Middle - Navigation */}
            <div style={styles.middle}>
                <Link to="/dashboard">Dashboard</Link>
                <Link to="/reports">Reports</Link>
                <Link to="/login">Login</Link>
            </div>

            {/* Right - Profile */}
            <div style={styles.right}>
                <img
                    src="https://via.placeholder.com/40"
                    alt="profile"
                    style={styles.profile}
                />
            </div>

        </header>
    );
}

const styles = {
    container: {
        width: "100%",
        height: "70px",
        background: "linear-gradient(90deg, #0f172a, #1e293b)", // gradient 🔥
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 30px",
        color: "white",
        boxShadow: "0 4px 10px rgba(0,0,0,0.3)",
        position: "sticky",
        top: 0,
        zIndex: 1000
    },

    left: {
        fontSize: "20px",
        fontWeight: "bold",
        letterSpacing: "1px"
    },

    middle: {
        display: "flex",
        gap: "30px"
    },

    link: {
        color: "#e5e7eb",
        textDecoration: "none",
        fontSize: "16px",
        transition: "0.3s"
    },

    right: {},

    profile: {
        width: "42px",
        height: "42px",
        borderRadius: "50%",
        border: "2px solid #38bdf8",
        cursor: "pointer"
    }
};

export default Navbar;