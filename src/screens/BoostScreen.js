import React, { useState, useEffect, useCallback } from "react";
import Navigation from "../components/Navigation";
import "./BoostScreen.css";

const BOOST_DURATION = 20000; // 20 seconds for Tapper Boost
const DAILY_RESET_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours

const BoostScreen = () => {
  const [activeOverlay, setActiveOverlay] = useState(null);
  const [totalTaps, setTotalTaps] = useState(0);
  const [boostersData, setBoostersData] = useState({ dailyBoosters: [], extraBoosters: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [dailyBoosters, setDailyBoosters] = useState(() => {
    const savedBoosters = localStorage.getItem("dailyBoosters");
    return savedBoosters
      ? JSON.parse(savedBoosters)
      : {
          tapperBoost: { usesLeft: 3, isActive: false, endTime: null, resetTime: null },
          fullEnergy: { usesLeft: 3, isActive: false, resetTime: null },
        };
  });

  const handleOverlayClose = () => setActiveOverlay(null);

  // Reset all local storage and state when account is deleted
  const resetAllLocalData = () => {
    const resetDailyState = {
      tapperBoost: { usesLeft: 3, isActive: false, endTime: null, resetTime: null },
      fullEnergy: { usesLeft: 3, isActive: false, resetTime: null },
    };
    setDailyBoosters(resetDailyState);
    localStorage.setItem("dailyBoosters", JSON.stringify(resetDailyState));
    setBoostersData({ dailyBoosters: [], extraBoosters: [] });
    setTotalTaps(0);
    localStorage.removeItem("extraBoosters");
    // Use consistent naming for localStorage keys
    localStorage.setItem("electricBoost", "1000");
    localStorage.setItem("baseTapMultiplier", "1");
    localStorage.setItem("maxElectricBoost", "1000");
    localStorage.setItem("rechargeTimeIndex", "0");
    localStorage.setItem("autoTapActive", "false");
    localStorage.removeItem("lastTapTime");
    localStorage.removeItem("telegram_user_id"); // Clear ID to force full reset on next login
  };

  useEffect(() => {
    localStorage.setItem("dailyBoosters", JSON.stringify(dailyBoosters));
  }, [dailyBoosters]);

  const fetchProfileAndBoosters = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) throw new Error("No access token found");

      const profileResponse = await fetch("https://bt-coins.onrender.com/user/profile", {
        method: "GET",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
      if (!profileResponse.ok) throw new Error("Profile fetch failed");
      const profileData = await profileResponse.json();

      // Detect account deletion by checking if stats are reset to initial state
      if (profileData.total_coins === 0 && profileData.level === 1) {
        resetAllLocalData(); // Wipe all local storage and reset state
      } else {
        setTotalTaps(profileData.total_coins || 0);
      }

      const extraBoostersResponse = await fetch("https://bt-coins.onrender.com/user/boost/extra_boosters", {
        method: "GET",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
      if (!extraBoostersResponse.ok) throw new Error("Extra boosters fetch failed");
      const extraBoostersData = await extraBoostersResponse.json();

      const mappedExtraBoosters = extraBoostersData.map((booster) => ({
        id: booster.booster_id,
        title: booster.name,
        description: booster.description,
        value: booster.upgrade_cost.toString(),
        level: booster.level === "-" ? "Not Owned" : `Level ${booster.level}`,
        ctaText: booster.level === "-" ? "Buy" : "Upgrade",
        altCTA: (profileData.total_coins || 0) < booster.upgrade_cost ? "Insufficient Funds" : null,
        actionIcon: `${process.env.PUBLIC_URL}/front-arrow.png`,
        icon: `${process.env.PUBLIC_URL}/extra-booster-icon.png`,
        imageId: booster.image_id,
        rawLevel: booster.level === "-" ? 0 : parseInt(booster.level, 10),
        effect: booster.effect, // e.g., "boost", "multiplier", "recharge", "auto-tap"
      }));

      setBoostersData({ extraBoosters: mappedExtraBoosters });
      localStorage.setItem("extraBoosters", JSON.stringify(mappedExtraBoosters));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfileAndBoosters();
  }, [fetchProfileAndBoosters]);

  const handleUpgradeBoost = async (boosterId) => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch(`https://bt-coins.onrender.com/user/boost/upgrade/${boosterId}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
      if (!response.ok) throw new Error("Upgrade failed");
      await fetchProfileAndBoosters();

      // Find the upgraded booster and dispatch appropriate event
      const extraBoosters = JSON.parse(localStorage.getItem("extraBoosters") || "[]");
      const booster = extraBoosters.find((b) => b.id === boosterId);
      
      if (booster) {
        const newLevel = booster.rawLevel === "-" || booster.rawLevel === 0 ? 1 : parseInt(booster.rawLevel, 10) + 1;
        
        // Store upgrade values in localStorage
        switch (booster.effect) {
          case "boost":
            const newMultiplier = 1 + newLevel; // Level 1: 2, Level 2: 3, Level 3: 4, etc.
            localStorage.setItem("baseTapMultiplier", newMultiplier.toString());
            window.dispatchEvent(new CustomEvent("boostUpgraded", { detail: { level: newLevel, multiplier: newMultiplier } }));
            break;
          case "multiplier":
            const newMaxEnergy = 1000 + (newLevel * 500); // Level 1: 1500, Level 2: 2000, etc.
            localStorage.setItem("maxElectricBoost", newMaxEnergy.toString());
            window.dispatchEvent(new CustomEvent("multiplierUpgraded", { detail: { level: newLevel, maxEnergy: newMaxEnergy } }));
            break;
          case "recharge":
            localStorage.setItem("rechargeTimeIndex", newLevel.toString());
            window.dispatchEvent(new CustomEvent("rechargeSpeedUpgraded", { detail: { level: newLevel } }));
            break;
          case "auto-tap":
            localStorage.setItem("autoTapActive", "true");
            window.dispatchEvent(new CustomEvent("autoTapActivated", { detail: { level: newLevel } }));
            break;
          default:
            window.dispatchEvent(new Event("boosterUpgraded"));
        }
      }
      handleOverlayClose();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleClaimDailyBooster = (boosterType) => {
    setDailyBoosters((prev) => {
        if (!prev || !prev[boosterType]) return prev; // Ensure booster exists

        const now = Date.now();
        const updated = { ...prev };

        const booster = updated[boosterType];

        if (booster.usesLeft > 0 && !booster.isActive) {
            if (boosterType === "tapperBoost") {
                updated.tapperBoost = {
                    ...booster, // Keep existing properties
                    usesLeft: booster.usesLeft - 1,
                    isActive: true,
                    endTime: now + BOOST_DURATION,
                    resetTime: booster.usesLeft === 3 ? null : booster.resetTime || now + DAILY_RESET_INTERVAL,
                };
                window.dispatchEvent(new Event("tapperBoostActivated"));
            } else if (boosterType === "fullEnergy") {
                updated.fullEnergy = {
                    ...booster,
                    usesLeft: booster.usesLeft - 1,
                    isActive: false, // Instant effect
                    resetTime: booster.usesLeft === 3 ? null : booster.resetTime || now + DAILY_RESET_INTERVAL,
                };

                const maxEnergy = parseInt(localStorage.getItem("maxElectricBoost") || "1000", 10);
                localStorage.setItem("electricBoost", maxEnergy.toString());
                window.dispatchEvent(new CustomEvent("fullEnergyClaimed", { detail: { maxEnergy } }));
            }

            // If no uses left, ensure resetTime is set
            if (updated[boosterType].usesLeft === 0 && !updated[boosterType].resetTime) {
                updated[boosterType].resetTime = now + DAILY_RESET_INTERVAL;
            }

            // Save updated boosters to localStorage for persistence
            localStorage.setItem("dailyBoosters", JSON.stringify(updated));

            return updated;
        }

        return prev;
    });

    handleOverlayClose();
};


  useEffect(() => {
    const intervalId = setInterval(() => {
      setDailyBoosters((prev) => {
        const updated = { ...prev };
        const now = Date.now();

        // Deactivate Tapper Boost after duration
        if (updated.tapperBoost.isActive && now >= updated.tapperBoost.endTime) {
          updated.tapperBoost.isActive = false;
          window.dispatchEvent(new Event("tapperBoostDeactivated"));
        }

        // Reset boosters when resetTime is reached
        ["tapperBoost", "fullEnergy"].forEach((type) => {
          const booster = updated[type];
          if (booster.usesLeft === 0 && booster.resetTime && now >= booster.resetTime) {
            booster.usesLeft = 3;
            booster.resetTime = null;
            booster.isActive = false;
          }
        });
        return updated;
      });
    }, 1000);
    return () => clearInterval(intervalId);
  }, []);

  const renderTimer = (boosterType) => {
    const booster = dailyBoosters[boosterType];
    if (boosterType === "tapperBoost" && booster.isActive) {
      const remaining = Math.max(0, (booster.endTime - Date.now()) / 1000);
      return `Active: ${Math.floor(remaining)}s`;
    } else if (booster.usesLeft > 0) {
      return `${booster.usesLeft}/3 uses left`;
    } else if (booster.resetTime) {
      const resetIn = Math.max(0, (booster.resetTime - Date.now()) / 1000);
      const hours = Math.floor(resetIn / 3600);
      const minutes = Math.floor((resetIn % 3600) / 60);
      const seconds = Math.floor(resetIn % 60);
      return `0/3 ${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds
        .toString()
        .padStart(2, "0")}`;
    }
    return "0/3";
  };

  const renderOverlay = () => {
    if (!activeOverlay) return null;
    const { type, title, description, value, level, ctaText, altCTA, id, icon } = activeOverlay;
    const isExtraBooster = type === "extra";
    const isDisabled = altCTA && value !== "Free";

    return (
      <div className="overlay-container">
        <div className={`boost-overlay ${activeOverlay ? "slide-in" : "slide-out"}`}>
          <div className="overlay-header">
            <h2 className="overlay-title">{title}</h2>
            <img
              src={`${process.env.PUBLIC_URL}/cancel.png`}
              alt="Cancel"
              className="overlay-cancel"
              onClick={handleOverlayClose}
            />
          </div>
          <div className="overlay-divider"></div>
          <div className="overlay-content">
            <img src={icon} alt={title} className="overlay-boost-icon" />
            <p className="overlay-description">{description}</p>
            <div className="overlay-value-container">
              <img src={`${process.env.PUBLIC_URL}/logo.png`} alt="Coin Icon" className="overlay-coin-icon" />
              <span className="overlay-value">{value}</span>
            </div>
            {level && <p className="overlay-level">{level}</p>}
            <button
              className="overlay-cta"
              disabled={isDisabled}
              onClick={isExtraBooster ? () => handleUpgradeBoost(id) : () => handleClaimDailyBooster(type)}
            >
              {isDisabled ? altCTA : ctaText}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="boost-screen">
      <div className="boost-body">
        <div className="total-taps-section">
          <p>Your Total Taps:</p>
          <div className="taps-display">
            <img src={`${process.env.PUBLIC_URL}/logo.png`} alt="Taps Icon" className="taps-icon" />
            <span className="total-taps-value">{totalTaps.toLocaleString()}</span>
          </div>
          <p className="bt-boost-info">How BT-boosters work?</p>
        </div>

        {loading ? (
          <p className="loading-message">Fetching Boosters...</p>
        ) : error ? (
          <p className="error-message">Error: {error}</p>
        ) : (
          <>
            <div className="daily-boosters-section">
              <p className="daily-boosters-title">Your Daily Boosters:</p>
              <div className="daily-boosters-container">
                {[
                  {
                    type: "tapperBoost",
                    title: "Tapper Boost",
                    icon: `${process.env.PUBLIC_URL}/tapperboost.png`,
                    usesLeft: dailyBoosters.tapperBoost.usesLeft,
                    timer: renderTimer("tapperBoost"),
                    isActive: dailyBoosters.tapperBoost.isActive,
                  },
                  {
                    type: "fullEnergy",
                    title: "Full Energy",
                    icon: `${process.env.PUBLIC_URL}/electric-icon.png`,
                    usesLeft: dailyBoosters.fullEnergy.usesLeft,
                    timer: renderTimer("fullEnergy"),
                    isActive: dailyBoosters.fullEnergy.isActive,
                  },
                ].map((booster) => (
                  <div
                    className="booster-frame"
                    key={booster.type}
                    onClick={() =>
                      booster.usesLeft > 0 &&
                      !booster.isActive &&
                      setActiveOverlay({
                        type: booster.type,
                        title: booster.title,
                        description:
                          booster.type === "tapperBoost"
                            ? "Multiply your tap income by X2 for 20 seconds."
                            : "Instantly refill energy to maximum.",
                        value: "Free",
                        ctaText: "Claim",
                        icon: booster.icon,
                      })
                    }
                  >
                    <img src={booster.icon} alt={booster.title} className="booster-icon" />
                    <div className="booster-info">
                      <p className="booster-title">{booster.title}</p>
                      <p className="booster-value">{booster.timer}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="extra-boosters-section">
              <p className="extra-boosters-title">Extra Boosters:</p>
              <div className="extra-boosters-container">
                {boostersData.extraBoosters.map((booster) => (
                  <div
                    className="extra-booster-card"
                    key={booster.id}
                    onClick={() =>
                      setActiveOverlay({
                        type: "extra",
                        title: booster.title,
                        description: booster.description,
                        value: booster.value,
                        level: booster.level,
                        ctaText: booster.ctaText,
                        altCTA: booster.altCTA,
                        id: booster.id,
                        icon: booster.icon,
                      })
                    }
                  >
                    <div className="booster-left">
                      <img src={booster.icon} alt={booster.title} className="booster-icon" />
                      <div className="booster-info">
                        <p className="booster-title">{booster.title}</p>
                        <div className="booster-meta">
                          <img
                            src={`${process.env.PUBLIC_URL}/logo.png`}
                            alt="Coin Icon"
                            className="small-icon"
                          />
                          <span>{booster.value}</span>
                        </div>
                      </div>
                    </div>
                    <img src={booster.actionIcon} alt="Action Icon" className="action-icon" />
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {renderOverlay()}
      <Navigation />
    </div>
  );
};

export default BoostScreen;