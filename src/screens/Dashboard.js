// // Dashboard.js
// import React, { useState, useEffect, useRef } from "react";
// import { useNavigate } from "react-router-dom";
// import Navigation from "../components/Navigation";
// import "./Dashboard.css";

// const Dashboard = () => {
//   const navigate = useNavigate();

//   // States for user and dashboard data
//   const [telegramData, setTelegramData] = useState({
//     telegram_user_id: "",
//     username: "User",
//     image_url: "",
//   });

//   const currentStreak = 0; // Will be implemented with backend integration
//   const level = 1; // Will be implemented with backend integration

//   const [totalTaps, setTotalTaps] = useState(0);
//   const [electricBoost, setElectricBoost] = useState(1000);
//   const [tapAnimation, setTapAnimation] = useState(false);
//   const [boostAnimation, setBoostAnimation] = useState(false);
//   const [loading, setLoading] = useState(true);
//   const [tapEffects, setTapEffects] = useState([]); // Tracks "+1" animations

//   // Ref for managing backend updates and electric recharge
//   const tapCountSinceLastUpdate = useRef(0); // Tracks taps for backend updates
//   const updateBackendTimeout = useRef(null); // Timeout for backend updates
//   const rechargeTimeout = useRef(null); // Timeout for electric boost recharge

//   // Initialization effect
//   useEffect(() => {
//     const initializeDashboard = async () => {
//       try {
//         if (window.Telegram?.WebApp) {
//           const user = window.Telegram.WebApp.initDataUnsafe.user;

//           if (user) {
//             const telegramInfo = {
//               telegram_user_id: user.id,
//               username: user.username || `User${user.id}`,
//               image_url:
//                 user.photo_url ||
//                 `${process.env.PUBLIC_URL}/profile-picture.png`,
//             };

//             setTelegramData(telegramInfo);

//             // Send user data to backend for validation
//             const response = await fetch(
//               "https://bored-tap-api.onrender.com/sign-up",
//               {
//                 method: "POST",
//                 headers: { "Content-Type": "application/json" },
//                 body: JSON.stringify(telegramInfo),
//               }
//             );

//             const data = await response.json();
//             if (data.success) {
//               console.log("User authenticated");
//             } else {
//               console.error("Authentication failed:", data.message);
//             }
//           } else {
//             console.error("Telegram user data not available");
//           }
//         }
//       } catch (err) {
//         console.error("Error syncing Telegram data:", err);
//       } finally {
//         setLoading(false);
//       }
//     };

//     initializeDashboard();
//   }, []);

//   // Handle tap effect with multi-touch and location responsiveness
//   const handleTap = (event) => {
//     if (electricBoost === 0) {
//       return; // Stop tapping if electric boost is depleted
//     }

//     const fingersCount = event.touches?.length || 1;
//     setTotalTaps((prev) => prev + fingersCount);
//     setElectricBoost((prev) => (prev > 0 ? prev - fingersCount : prev));
//     tapCountSinceLastUpdate.current += fingersCount; // Track taps for backend updates

//     // Get tap position relative to the screen
//     const tapX = event.touches?.[0]?.clientX || event.clientX;
//     const tapY = event.touches?.[0]?.clientY || event.clientY;

//     // Create floating "+1" effect at the tap position
//     const newTapEffect = { id: Date.now(), x: tapX, y: tapY, count: fingersCount };
//     setTapEffects((prevEffects) => [...prevEffects, newTapEffect]);

//     playTapSound();

//     // Start animation
//     setTapAnimation(true);
//     setBoostAnimation(true);
//     setTimeout(() => setTapAnimation(false), 500);

//     // Remove "+1" effect after animation
//     setTimeout(() => {
//       setTapEffects((prevEffects) =>
//         prevEffects.filter((effect) => effect.id !== newTapEffect.id)
//       );
//     }, 1000);

//     // Start backend update timer
//     if (updateBackendTimeout.current) {
//       clearTimeout(updateBackendTimeout.current);
//     }
//     updateBackendTimeout.current = setTimeout(updateBackend, 3000); // Update backend every 3 seconds
//   };

//   const playTapSound = () => {
//     const audio = new Audio(`${process.env.PUBLIC_URL}/tap.mp3`);
//     audio.volume = 0.3;
//     audio.play().catch((err) => console.error("Audio playback error:", err));
//   };

//   // Update backend with total taps every 3 seconds
//   const updateBackend = async () => {
//     if (tapCountSinceLastUpdate.current > 0) {
//       try {
//         const response = await fetch(
//           `https://bored-tap-api.onrender.com/update-coins?coins=${tapCountSinceLastUpdate.current}`,
//           {
//             method: "POST",
//             headers: { "Content-Type": "application/json" },
//           }
//         );

//         const data = await response.json();
//         if (response.ok) {
//           console.log("Backend updated successfully:", data);
//         } else {
//           console.error("Failed to update backend:", data.detail);
//         }
//       } catch (err) {
//         console.error("Error updating backend:", err);
//       } finally {
//         tapCountSinceLastUpdate.current = 0; // Reset tap count after updating
//       }
//     }
//   };

//   // Recharge electric boost after 1 hour
//   useEffect(() => {
//     if (electricBoost === 0) {
//       rechargeTimeout.current = setTimeout(() => {
//         setElectricBoost(1000); // Recharge electric boost to full
//         console.log("Electric boost recharged to 1000/1000");
//       }, 60 * 60 * 1000); // 1 hour
//     }

//     return () => {
//       if (rechargeTimeout.current) {
//         clearTimeout(rechargeTimeout.current);
//       }
//     };
//   }, [electricBoost]);

//   if (loading) {
//     return <div className="loading">Loading...</div>;
//   }

//   return (
//     <div className="dashboard-container">
//       {/* Profile and Streak Section */}
//       <div className="profile-streak-section">
//         <div
//           className="profile-section"
//           onClick={() => navigate("/profile-screen")}
//         >
//           <img
//             src={telegramData.image_url}
//             alt="Profile"
//             className="profile-picture"
//           />
//           <div className="profile-info">
//             <span className="profile-username">{telegramData.username}</span>
//             <span className="profile-level">Lvl {level}</span>
//           </div>
//         </div>

//         <div
//           className="streak-section"
//           onClick={() => navigate("/daily-streak-screen")}
//         >
//           <img
//             src={`${process.env.PUBLIC_URL}/streak.png`}
//             alt="Streak Icon"
//             className="streak-icon"
//           />
//           <div className="streak-info">
//             <span className="streak-text">Current Streak</span>
//             <span className="streak-days">Day {currentStreak}</span>
//           </div>
//         </div>
//       </div>

//       {/* Frames Section */}
//       <div className="frames-section">
//         {[{ name: "Rewards", icon: "reward.png", path: "/reward-screen" },
//           { name: "Challenge", icon: "challenge.png", path: "/challenge-screen" },
//           { name: "Clan", icon: "clan.png", path: "/clan-screen" },
//           { name: "Leaderboard", icon: "leaderboard.png", path: "/leaderboard-screen" },
//         ].map((frame, index) => (
//           <div
//             className="frame"
//             key={index}
//             onClick={() => navigate(frame.path)}
//           >
//             <img
//               src={`${process.env.PUBLIC_URL}/${frame.icon}`}
//               alt={`${frame.name} Icon`}
//               className="frame-icon"
//             />
//             <span>{frame.name}</span>
//           </div>
//         ))}
//       </div>

//       {/* Total Taps Section */}
//       <div className="total-taps-section">
//         <p className="total-taps-text">Your Total Taps:</p>
//         <div className="total-taps-count">
//           <img
//             className="tap-logo-small"
//             src={`${process.env.PUBLIC_URL}/logo.png`}
//             alt="Small Icon"
//           />
//           <span>{totalTaps}</span>
//         </div>
//         <div
//           className={`big-tap-icon ${tapAnimation ? "tap-animation" : ""}`}
//           onTouchStart={handleTap}
//           onClick={handleTap}
//         >
//           <img
//             className="tap-logo-big"
//             src={`${process.env.PUBLIC_URL}/logo.png`}
//             alt="Big Tap Icon"
//           />
//         </div>

//         {/* Render floating "+1" effects */}
//         {tapEffects.map((effect) => (
//           <div
//             key={effect.id}
//             className="tap-effect"
//             style={{ top: effect.y, left: effect.x }}
//           >
//             +{effect.count}
//           </div>
//         ))}
//       </div>

//       {/* Electric Boost Section */}
//       <div className="electric-boost-section">
//         <div className={`electric-value ${boostAnimation ? "boost-animation" : ""}`}>
//           <img
//             src={`${process.env.PUBLIC_URL}/electric-icon.png`}
//             alt="Electric Icon"
//             className="electric-icon"
//           />
//           <span>{electricBoost}/1000</span>
//         </div>
//         <button className="boost-btn" onClick={() => navigate("/boost-screen")}>
//           <img
//             src={`${process.env.PUBLIC_URL}/boostx2.png`}
//             alt="Boost Icon"
//             className="boost-icon"
//           />
//           Boost
//         </button>
//       </div>

//       <Navigation />
//     </div>
//   );
// };

// export default Dashboard;
// Dashboard.js
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "../components/Navigation";
import "./Dashboard.css";

const Dashboard = () => {
  const navigate = useNavigate();

  // States for user and dashboard data
  const [telegramData, setTelegramData] = useState({
    telegram_user_id: "",
    username: "User",
    image_url: "",
  });

  const currentStreak = 0; // Will be implemented with backend integration
  const level = 1; // Will be implemented with backend integration

  const [totalTaps, setTotalTaps] = useState(0);
  const [electricBoost, setElectricBoost] = useState(1000);
  const [tapAnimation, setTapAnimation] = useState(false);
  const [boostAnimation, setBoostAnimation] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tapEffects, setTapEffects] = useState([]); // Tracks "+1" animations
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState(null);

  // Ref for managing backend updates and electric recharge
  const tapCountSinceLastUpdate = useRef(0); // Tracks taps for backend updates
  const updateBackendTimeout = useRef(null); // Timeout for backend updates
  const rechargeTimeout = useRef(null); // Timeout for electric boost recharge

  // Initialization effect
  useEffect(() => {
    const initializeDashboard = async () => {
      try {
        if (window.Telegram?.WebApp) {
          const user = window.Telegram.WebApp.initDataUnsafe.user;

          if (user) {
            const telegramInfo = {
              telegram_user_id: user.id,
              username: user.username || `User${user.id}`,
              image_url:
                user.photo_url ||
                `${process.env.PUBLIC_URL}/profile-picture.png`,
            };

            setTelegramData(telegramInfo);

            // Send user data to backend for validation
            const response = await fetch(
              "https://bored-tap-api.onrender.com/user/profile",
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(telegramInfo),
              }
            );

            const data = await response.json();
            if (data.success) {
              console.log("User authenticated");
            } else {
              console.error("Authentication failed:", data.message);
            }
          } else {
            console.error("Telegram user data not available");
          }
        }
      } catch (err) {
        console.error("Error syncing Telegram data:", err);
      } finally {
        setLoading(false);
      }
    };

    initializeDashboard();
  }, []);

  // Fetch profile data from the backend
  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem("accessToken");

      if (!token) {
        navigate("/splash"); // Redirect to splash screen if no token is found
        return;
      }

      try {
        const response = await fetch("https://bored-tap-api.onrender.com/user/profile", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error("Unauthorized. Please log in again.");
          }
          throw new Error("Failed to fetch profile data.");
        }

        const data = await response.json();
        setProfile(data); // Set profile data into state
      } catch (err) {
        setError(err.message); // Set error message
        console.error("Error fetching profile:", err);
      } finally {
        setLoading(false); // Stop loading once the data is fetched
      }
    };

    fetchProfile();
  }, [navigate]);

  // Handle tap effect with multi-touch and location responsiveness
  const handleTap = (event) => {
    if (electricBoost === 0) {
      return; // Stop tapping if electric boost is depleted
    }

    const fingersCount = event.touches?.length || 1;
    setTotalTaps((prev) => prev + fingersCount);
    setElectricBoost((prev) => (prev > 0 ? prev - fingersCount : prev));
    tapCountSinceLastUpdate.current += fingersCount; // Track taps for backend updates

    // Get tap position relative to the screen
    const tapX = event.touches?.[0]?.clientX || event.clientX;
    const tapY = event.touches?.[0]?.clientY || event.clientY;

    // Create floating "+1" effect at the tap position
    const newTapEffect = { id: Date.now(), x: tapX, y: tapY, count: fingersCount };
    setTapEffects((prevEffects) => [...prevEffects, newTapEffect]);

    playTapSound();

    // Start animation
    setTapAnimation(true);
    setBoostAnimation(true);
    setTimeout(() => setTapAnimation(false), 500);

    // Remove "+1" effect after animation
    setTimeout(() => {
      setTapEffects((prevEffects) =>
        prevEffects.filter((effect) => effect.id !== newTapEffect.id)
      );
    }, 1000);

    // Start backend update timer
    if (updateBackendTimeout.current) {
      clearTimeout(updateBackendTimeout.current);
    }
    updateBackendTimeout.current = setTimeout(updateBackend, 3000); // Update backend every 3 seconds
  };

  const playTapSound = () => {
    const audio = new Audio(`${process.env.PUBLIC_URL}/tap.mp3`);
    audio.volume = 0.3;
    audio.play().catch((err) => console.error("Audio playback error:", err));
  };

  // Update backend with total taps every 3 seconds
  const updateBackend = async () => {
    if (tapCountSinceLastUpdate.current > 0) {
      try {
        const token = localStorage.getItem("accessToken");
        const response = await fetch(
          `https://bored-tap-api.onrender.com/update-coins?coins=${tapCountSinceLastUpdate.current}`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        const data = await response.json();
        if (response.ok) {
          console.log("Backend updated successfully:", data);
        } else {
          console.error("Failed to update backend:", data.detail);
        }
      } catch (err) {
        console.error("Error updating backend:", err);
      } finally {
        tapCountSinceLastUpdate.current = 0; // Reset tap count after updating
      }
    }
  };

  // Recharge electric boost after 1 hour
  useEffect(() => {
    if (electricBoost === 0) {
      rechargeTimeout.current = setTimeout(() => {
        setElectricBoost(1000); // Recharge electric boost to full
        console.log("Electric boost recharged to 1000/1000");
      }, 60 * 60 * 1000); // 1 hour
    }

    return () => {
      if (rechargeTimeout.current) {
        clearTimeout(rechargeTimeout.current);
      }
    };
  }, [electricBoost]);

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="dashboard-container">
      {/* Profile and Streak Section */}
      <div className="profile-streak-section">
        <div
          className="profile-section"
          onClick={() => navigate("/profile-screen")}
        >
          <img
            src={telegramData.image_url}
            alt="Profile"
            className="profile-picture"
          />
          <div className="profile-info">
            <span className="profile-username">{telegramData.username}</span>
            <span className="profile-level">Lvl {level}</span>
          </div>
        </div>

        <div
          className="streak-section"
          onClick={() => navigate("/daily-streak-screen")}
        >
          <img
            src={`${process.env.PUBLIC_URL}/streak.png`}
            alt="Streak Icon"
            className="streak-icon"
          />
          <div className="streak-info">
            <span className="streak-text">Current Streak</span>
            <span className="streak-days">Day {currentStreak}</span>
          </div>
        </div>
      </div>

      {/* Frames Section */}
      <div className="frames-section">
        {[{ name: "Rewards", icon: "reward.png", path: "/reward-screen" },
          { name: "Challenge", icon: "challenge.png", path: "/challenge-screen" },
          { name: "Clan", icon: "clan.png", path: "/clan-screen" },
          { name: "Leaderboard", icon: "leaderboard.png", path: "/leaderboard-screen" },
        ].map((frame, index) => (
          <div
            className="frame"
            key={index}
            onClick={() => navigate(frame.path)}
          >
            <img
              src={`${process.env.PUBLIC_URL}/${frame.icon}`}
              alt={`${frame.name} Icon`}
              className="frame-icon"
            />
            <span>{frame.name}</span>
          </div>
        ))}
      </div>

      {/* Total Taps Section */}
      <div className="total-taps-section">
        <p className="total-taps-text">Your Total Taps:</p>
        <div className="total-taps-count">
          <img
            className="tap-logo-small"
            src={`${process.env.PUBLIC_URL}/logo.png`}
            alt="Small Icon"
          />
          <span>{totalTaps}</span>
        </div>
        <div
          className={`big-tap-icon ${tapAnimation ? "tap-animation" : ""}`}
          onTouchStart={handleTap}
          onClick={handleTap}
        >
          <img
            className="tap-logo-big"
            src={`${process.env.PUBLIC_URL}/logo.png`}
            alt="Big Tap Icon"
          />
        </div>

        {/* Render floating "+1" effects */}
        {tapEffects.map((effect) => (
          <div
            key={effect.id}
            className="tap-effect"
            style={{ top: effect.y, left: effect.x }}
          >
            +{effect.count}
          </div>
        ))}
      </div>

      {/* Electric Boost Section */}
      <div className="electric-boost-section">
        <div className={`electric-value ${boostAnimation ? "boost-animation" : ""}`}>
          <img
            src={`${process.env.PUBLIC_URL}/electric-icon.png`}
            alt="Electric Icon"
            className="electric-icon"
          />
          <span>{electricBoost}/1000</span>
        </div>
        <button className="boost-btn" onClick={() => navigate("/boost-screen")}>
          <img
            src={`${process.env.PUBLIC_URL}/boostx2.png`}
            alt="Boost Icon"
            className="boost-icon"
          />
          Boost
        </button>
      </div>

      <Navigation />
    </div>
  );
};

export default Dashboard;
