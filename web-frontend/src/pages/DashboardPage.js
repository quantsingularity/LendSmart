import React from "react";
// import AuthContext from "../contexts/AuthContext"; // Example
// import apiService from "../services/apiService"; // Example

const DashboardPage = () => {
  // const { user } = useContext(AuthContext); // Example
  // const [loans, setLoans] = useState([]);
  // const [loading, setLoading] = useState(true);

  // useEffect(() => {
  //   const fetchUserLoans = async () => {
  //     try {
  //       // Assuming an endpoint like /api/users/me/loans or /api/loans?userId=...
  //       // const userLoans = await apiService.getUserLoans(user._id);
  //       // setLoans(userLoans.data);
  //       setLoading(false);
  //     } catch (error) {
  //       console.error("Failed to fetch user loans", error);
  //       setLoading(false);
  //     }
  //   };
  //   if (user) fetchUserLoans();
  // }, [user]);

  const user = { username: "TestUser", email: "test@example.com" }; // Placeholder

  return (
    <div className="page-container dashboard">
      <h2>Welcome to your Dashboard, {user?.username || "User"}!</h2>
      <p>
        Here you can manage your loan applications, investments, and profile
        settings.
      </p>

      <div className="dashboard-sections">
        <section className="dashboard-section">
          <h3>My Profile</h3>
          <p>Email: {user?.email}</p>
          {/* Link to profile edit page */}
          <a href="/profile/edit" className="button">
            Edit Profile
          </a>
        </section>

        <section className="dashboard-section">
          <h3>My Loans (as Borrower)</h3>
          {/* Placeholder for loans list - map through loans state */}
          <p>You have no active loan applications.</p>
          <a href="/loans/apply" className="button">
            Apply for a New Loan
          </a>
        </section>

        <section className="dashboard-section">
          <h3>My Investments (as Lender)</h3>
          {/* Placeholder for investments list - map through loans state where user is lender */}
          <p>You have no active investments.</p>
          <a href="/loans" className="button">
            Browse Marketplace
          </a>
        </section>
      </div>

      <style jsx>{`
        .dashboard {
          padding: 20px;
        }
        .dashboard h2 {
          color: #333;
          text-align: center;
          margin-bottom: 30px;
        }
        .dashboard-sections {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 20px;
        }
        .dashboard-section {
          background-color: #fff;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        .dashboard-section h3 {
          color: #007bff;
          margin-top: 0;
          margin-bottom: 15px;
        }
        .button {
          display: inline-block;
          margin-top: 10px;
        }
      `}</style>
    </div>
  );
};

export default DashboardPage;
