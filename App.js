import React, { useState } from "react";
import "./styles.css";

const App = () => {
  // --- AUTHENTICATION STATE ---
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [pin, setPin] = useState("");

  // --- NAVIGATION & UI STATE ---
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPropertyId, setSelectedPropertyId] = useState(null);
  const [selectedFlat, setSelectedFlat] = useState(null);
  const [currentFloorForNewFlat, setCurrentFloorForNewFlat] = useState(null);

  const [isEditing, setIsEditing] = useState(false);
  const [isRecordingPayment, setIsRecordingPayment] = useState(false);

  const [paymentAmount, setPaymentAmount] = useState("");
  const [flatFormData, setFlatFormData] = useState({});

  // --- UNIFIED DATABASE STATE ---
  const [estateData, setEstateData] = useState([
    {
      id: 1,
      name: "Keerthi Residency",
      floors: [
        {
          floorNumber: 1,
          flats: [
            {
              number: "101",
              status: "Rented",
              tenantName: "Ramesh Kumar",
              phone: "9848012345",
              advance: true,
              dues: 5000,
              lastPaid: "21-07-2026",
              dueDate: "22-08-2026",
              notes: "Promised to fix the kitchen sink tap next week.",
            },
            {
              number: "102",
              status: "Vacant",
              tenantName: "—",
              phone: "—",
              advance: false,
              dues: 0,
              lastPaid: "—",
              dueDate: "—",
              notes: "",
            },
          ],
        },
        {
          floorNumber: 2,
          flats: [
            {
              number: "201",
              status: "Rented",
              tenantName: "Suresh Reddy",
              phone: "9123456789",
              advance: true,
              dues: 15000,
              lastPaid: "15-06-2026",
              dueDate: "15-07-2026",
              notes: "",
            },
          ],
        },
      ],
    },
    { id: 2, name: "Annapurna Nilayam", floors: [] },
    { id: 3, name: "Sri Nilayam", floors: [] },
  ]);

  // Derived current property
  const currentBuilding = estateData.find((p) => p.id === selectedPropertyId);

  // --- HELPER FUNCTIONS ---
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (pin === "1234") {
      setIsLoggedIn(true);
    } else {
      alert("Incorrect PIN. For this demo, use: 1234");
      setPin("");
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setPin("");
    setSelectedPropertyId(null);
    setSelectedFlat(null);
  };

  // --- SEARCH LOGIC ---
  const allFlats = estateData.flatMap((property) =>
    property.floors.flatMap((floor) =>
      floor.flats.map((flat) => ({
        ...flat,
        buildingName: property.name,
        propertyId: property.id,
        floorNumber: floor.floorNumber,
      }))
    )
  );

  const activeSearchResults =
    searchQuery.trim() === ""
      ? []
      : allFlats.filter((flat) => {
          const query = searchQuery.toLowerCase();
          return (
            (flat.tenantName || "").toLowerCase().includes(query) ||
            (flat.phone || "").toLowerCase().includes(query) ||
            (flat.number || "").toLowerCase().includes(query)
          );
        });

  const handleSearchResultClick = (flat) => {
    setSearchQuery("");
    setSelectedPropertyId(flat.propertyId);
    setSelectedFlat(flat);
  };

  // --- DISCREET ADD FUNCTIONS ---
  const handleAddProperty = () => {
    const newName = window.prompt("Enter new property name:");
    if (newName && newName.trim() !== "") {
      const newProperty = {
        id: Date.now(),
        name: newName,
        floors: [{ floorNumber: 1, flats: [] }], // Starts with 1 empty floor
      };
      setEstateData([...estateData, newProperty]);
    }
  };

  const handleAddFloor = () => {
    const newFloorNum =
      currentBuilding.floors.length > 0
        ? Math.max(...currentBuilding.floors.map((f) => f.floorNumber)) + 1
        : 1;

    const updatedEstate = estateData.map((prop) => {
      if (prop.id === selectedPropertyId) {
        return {
          ...prop,
          floors: [...prop.floors, { floorNumber: newFloorNum, flats: [] }],
        };
      }
      return prop;
    });
    setEstateData(updatedEstate);
  };

  // --- DATA MUTATION FUNCTIONS ---
  const handleSaveFlat = () => {
    if (!flatFormData.number) {
      alert("Please enter a flat number.");
      return;
    }

    const floorNum = isEditing
      ? selectedFlat.floorNumber
      : currentFloorForNewFlat;

    const updatedEstate = estateData.map((prop) => {
      if (prop.id === selectedPropertyId) {
        const updatedFloors = prop.floors.map((floor) => {
          if (floor.floorNumber === floorNum) {
            if (isEditing) {
              return {
                ...floor,
                flats: floor.flats.map((f) =>
                  f.number === selectedFlat.number ? { ...flatFormData } : f
                ),
              };
            } else {
              return { ...floor, flats: [...floor.flats, { ...flatFormData }] };
            }
          }
          return floor;
        });
        return { ...prop, floors: updatedFloors };
      }
      return prop;
    });

    setEstateData(updatedEstate);

    if (isEditing) {
      setSelectedFlat({
        ...flatFormData,
        buildingName: currentBuilding.name,
        propertyId: currentBuilding.id,
        floorNumber: floorNum,
      });
      setIsEditing(false);
    } else {
      setCurrentFloorForNewFlat(null);
    }
  };

  const handleSavePayment = () => {
    const amount = parseInt(paymentAmount) || 0;
    const newDues = Math.max(0, selectedFlat.dues - amount);

    const today = new Date();
    const dateString = `${today.getDate().toString().padStart(2, "0")}-${(
      today.getMonth() + 1
    )
      .toString()
      .padStart(2, "0")}-${today.getFullYear()}`;
    const nextMonth = new Date(today.setMonth(today.getMonth() + 1));
    const nextDueDateString = `${nextMonth
      .getDate()
      .toString()
      .padStart(2, "0")}-${(nextMonth.getMonth() + 1)
      .toString()
      .padStart(2, "0")}-${nextMonth.getFullYear()}`;

    const updatedFlat = {
      ...selectedFlat,
      dues: newDues,
      lastPaid: dateString,
      dueDate: nextDueDateString,
    };

    const updatedEstate = estateData.map((prop) => {
      if (prop.id === selectedPropertyId) {
        const updatedFloors = prop.floors.map((floor) => {
          if (floor.floorNumber === selectedFlat.floorNumber) {
            return {
              ...floor,
              flats: floor.flats.map((f) =>
                f.number === selectedFlat.number ? updatedFlat : f
              ),
            };
          }
          return floor;
        });
        return { ...prop, floors: updatedFloors };
      }
      return prop;
    });

    setEstateData(updatedEstate);
    setSelectedFlat(updatedFlat);
    setIsRecordingPayment(false);
    setPaymentAmount("");
  };

  // --- UI RENDERERS ---

  const renderLoginView = () => (
    <div className="login-container">
      <div className="login-card">
        <h1 className="login-title">Keerthi Estates</h1>
        <p className="login-subtitle">Secure Ledger Access</p>
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label style={{ textAlign: "center" }}>Enter Admin PIN</label>
            <input
              type="password"
              className="form-input pin-input"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="••••"
              maxLength="4"
              autoFocus
            />
          </div>
          <button type="submit" className="primary-action-btn w-full mt-4">
            Unlock Dashboard
          </button>
        </form>
      </div>
    </div>
  );

  const renderFlatFormView = () => (
    <div className="detail-view">
      <button
        className="back-button"
        onClick={() => {
          isEditing ? setIsEditing(false) : setCurrentFloorForNewFlat(null);
        }}
      >
        ← Cancel
      </button>
      <header className="header">
        <h1>
          {isEditing
            ? `Edit Flat ${selectedFlat.number}`
            : `Add Flat to Floor ${currentFloorForNewFlat}`}
        </h1>
        <p className="sub-header-text">{currentBuilding.name}</p>
      </header>

      <div className="form-card">
        <div className="form-group">
          <label>Flat Number</label>
          <input
            type="text"
            className="form-input"
            value={flatFormData.number || ""}
            onChange={(e) =>
              setFlatFormData({ ...flatFormData, number: e.target.value })
            }
            placeholder="e.g. 104"
          />
        </div>
        <div className="form-group">
          <label>Status</label>
          <select
            className="form-input select-input"
            value={flatFormData.status || "Vacant"}
            onChange={(e) =>
              setFlatFormData({ ...flatFormData, status: e.target.value })
            }
          >
            <option value="Vacant">Vacant</option>
            <option value="Rented">Rented</option>
            <option value="For Sale">For Sale</option>
            <option value="Sold">Sold</option>
          </select>
        </div>

        {flatFormData.status === "Rented" && (
          <div className="conditional-form-section">
            <div className="form-group">
              <label>Tenant Name</label>
              <input
                type="text"
                className="form-input"
                value={flatFormData.tenantName || ""}
                onChange={(e) =>
                  setFlatFormData({
                    ...flatFormData,
                    tenantName: e.target.value,
                  })
                }
              />
            </div>
            <div className="form-group">
              <label>Phone Number</label>
              <input
                type="tel"
                className="form-input"
                value={flatFormData.phone || ""}
                onChange={(e) =>
                  setFlatFormData({ ...flatFormData, phone: e.target.value })
                }
              />
            </div>
            <div className="form-group row-group">
              <label>Advance Received?</label>
              <input
                type="checkbox"
                className="form-checkbox"
                checked={flatFormData.advance || false}
                onChange={(e) =>
                  setFlatFormData({
                    ...flatFormData,
                    advance: e.target.checked,
                  })
                }
              />
            </div>
            <div className="form-group">
              <label>Current Dues (₹)</label>
              <input
                type="number"
                className="form-input"
                value={flatFormData.dues || 0}
                onChange={(e) =>
                  setFlatFormData({
                    ...flatFormData,
                    dues: parseInt(e.target.value) || 0,
                  })
                }
              />
            </div>
          </div>
        )}

        <div className="conditional-form-section">
          <div className="form-group">
            <label>Private Notes / Reminders</label>
            <textarea
              className="form-input textarea-input"
              rows="3"
              value={flatFormData.notes || ""}
              onChange={(e) =>
                setFlatFormData({ ...flatFormData, notes: e.target.value })
              }
              placeholder="e.g., Needs plumbing check next month..."
            />
          </div>
        </div>
      </div>
      <button
        className="primary-action-btn w-full mt-4"
        onClick={handleSaveFlat}
      >
        Save Flat Details
      </button>
    </div>
  );

  const renderPaymentView = () => (
    <div className="detail-view">
      <button
        className="back-button"
        onClick={() => setIsRecordingPayment(false)}
      >
        ← Cancel
      </button>
      <header className="header">
        <h1>Record Payment</h1>
        <p className="sub-header-text">
          Flat {selectedFlat.number} • {selectedFlat.tenantName}
        </p>
      </header>

      <div className="form-card">
        <div className="form-group">
          <label>Current Outstanding Dues</label>
          <span className="text-3xl font-bold text-red-600 mb-4 block">
            {selectedFlat.dues > 0 ? `₹${selectedFlat.dues}` : "Clear"}
          </span>
        </div>
        <div className="form-group conditional-form-section">
          <label>Amount Paid Today (₹)</label>
          <input
            type="number"
            className="form-input"
            value={paymentAmount}
            onChange={(e) => setPaymentAmount(e.target.value)}
            placeholder={`e.g. ${
              selectedFlat.dues > 0 ? selectedFlat.dues : 15000
            }`}
            autoFocus
          />
        </div>
      </div>
      <button
        className="primary-action-btn w-full mt-4"
        onClick={handleSavePayment}
      >
        Confirm Payment
      </button>
    </div>
  );

  const renderFlatDetailView = () => (
    <div className="detail-view">
      <button className="back-button" onClick={() => setSelectedFlat(null)}>
        ← Back to Building
      </button>
      <header className="header">
        <h1>Flat {selectedFlat.number}</h1>
        <p className="sub-header-text">
          {selectedFlat.buildingName || currentBuilding.name}
        </p>
      </header>

      <div className="flat-profile-card">
        <div className="profile-row">
          <span className="label">Status:</span>
          <span
            className={`status-badge ${selectedFlat.status
              .toLowerCase()
              .replace(" ", "-")}`}
          >
            {selectedFlat.status}
          </span>
        </div>
        {selectedFlat.status === "Rented" && (
          <>
            <div className="profile-row">
              <span className="label">Tenant:</span>
              <span className="value bold">{selectedFlat.tenantName}</span>
            </div>
            <div className="profile-row">
              <span className="label">Phone:</span>
              <div className="phone-action-group">
                <span className="value">{selectedFlat.phone}</span>
                <a href={`tel:${selectedFlat.phone}`} className="call-btn">
                  Call
                </a>
              </div>
            </div>
            <div className="profile-row">
              <span className="label">Last Paid:</span>
              <span className="value">{selectedFlat.lastPaid}</span>
            </div>
            <div className="profile-row highlight-due">
              <span className="label">Due Date:</span>
              <span
                className={`value ${
                  selectedFlat.dues > 0 ? "dues-pending" : ""
                }`}
              >
                {selectedFlat.dueDate}{" "}
                {selectedFlat.dues > 0 && `(₹${selectedFlat.dues} Due)`}
              </span>
            </div>
          </>
        )}
      </div>

      {selectedFlat.notes && (
        <div className="notes-display-card">
          <h3 className="notes-title">📌 Owner Notes</h3>
          <p className="notes-content">{selectedFlat.notes}</p>
        </div>
      )}

      <div className="action-buttons-container">
        {selectedFlat.status === "Rented" && (
          <button
            className="primary-action-btn"
            onClick={() => setIsRecordingPayment(true)}
          >
            Record Payment
          </button>
        )}
        <button
          className="secondary-action-btn"
          onClick={() => {
            setFlatFormData(selectedFlat);
            setIsEditing(true);
          }}
        >
          Edit Flat Details
        </button>
      </div>
    </div>
  );

  const renderBuildingView = () => {
    const summary = { rented: 0, vacant: 0, forSale: 0, sold: 0 };
    let totalFlats = 0;

    currentBuilding.floors.forEach((floor) => {
      floor.flats.forEach((flat) => {
        totalFlats++;
        if (flat.status === "Rented") summary.rented++;
        if (flat.status === "Vacant") summary.vacant++;
        if (flat.status === "For Sale") summary.forSale++;
        if (flat.status === "Sold") summary.sold++;
      });
    });

    return (
      <div className="detail-view">
        <button
          className="back-button"
          onClick={() => setSelectedPropertyId(null)}
        >
          ← Back to Properties
        </button>
        <header className="header">
          <h1>{currentBuilding.name}</h1>
          <p className="sub-header-text">{totalFlats} Flats total</p>
        </header>

        <div className="summary-grid">
          <div className="summary-card rented">
            <span className="count">{summary.rented}</span>
            <span className="label">Rented</span>
          </div>
          <div className="summary-card vacant">
            <span className="count">{summary.vacant}</span>
            <span className="label">Vacant</span>
          </div>
          <div className="summary-card sale">
            <span className="count">{summary.forSale}</span>
            <span className="label">For Sale</span>
          </div>
          <div className="summary-card sold">
            <span className="count">{summary.sold}</span>
            <span className="label">Sold</span>
          </div>
        </div>

        <div className="floors-container">
          {currentBuilding.floors.map((floor, index) => (
            <div key={index} className="floor-section">
              <h2 className="floor-title">Floor {floor.floorNumber}</h2>
              <div className="flat-grid">
                {floor.flats.map((flat) => (
                  <div
                    key={flat.number}
                    className={`flat-card ${flat.status
                      .toLowerCase()
                      .replace(" ", "-")}`}
                    onClick={() =>
                      setSelectedFlat({
                        ...flat,
                        floorNumber: floor.floorNumber,
                      })
                    }
                  >
                    <div className="flat-header">
                      <span className="flat-number">Flat {flat.number}</span>
                      <span
                        className={`status-badge ${flat.status
                          .toLowerCase()
                          .replace(" ", "-")}`}
                      >
                        {flat.status}
                      </span>
                    </div>
                    {flat.status === "Rented" && (
                      <div className="flat-details">
                        <p>
                          Tenant: <strong>{flat.tenantName}</strong>
                        </p>
                        <p
                          className={
                            flat.dues > 0 ? "dues-pending" : "dues-clear"
                          }
                        >
                          Dues:{" "}
                          <strong>
                            {flat.dues > 0 ? `₹${flat.dues}` : "Clear"}
                          </strong>
                        </p>
                      </div>
                    )}
                  </div>
                ))}

                {/* DISCREET ADD FLAT BUTTON */}
                <button
                  className="discreet-btn"
                  onClick={() => {
                    setFlatFormData({
                      status: "Vacant",
                      dues: 0,
                      advance: false,
                      notes: "",
                    });
                    setCurrentFloorForNewFlat(floor.floorNumber);
                  }}
                >
                  + add flat
                </button>
              </div>
            </div>
          ))}

          {/* DISCREET ADD FLOOR BUTTON */}
          <div style={{ marginTop: "30px", textAlign: "right" }}>
            <button className="discreet-btn" onClick={handleAddFloor}>
              + add floor
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderHomeView = () => (
    <>
      <div className="home-top-bar">
        <div className="greeting-container">
          <h2 className="greeting-time">{getGreeting()},</h2>
          <h1 className="greeting-name">Mr. Keerthi</h1>
        </div>
        <button onClick={handleLogout} className="logout-btn">
          Log Out
        </button>
      </div>

      <div className="search-container">
        <input
          type="text"
          className={`search-bar ${searchQuery ? "active-search" : ""}`}
          placeholder="🔍 Search tenant, phone, or flat..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <div className="search-dropdown">
            {activeSearchResults.length > 0 ? (
              activeSearchResults.map((flat) => (
                <div
                  key={flat.number}
                  className="search-result-item"
                  onClick={() => handleSearchResultClick(flat)}
                >
                  <div className="result-title">
                    Flat {flat.number} • {flat.buildingName}
                  </div>
                  <div className="result-subtitle">
                    {flat.status === "Rented"
                      ? `👤 ${flat.tenantName} | 📞 ${flat.phone}`
                      : `Status: ${flat.status}`}
                  </div>
                </div>
              ))
            ) : (
              <div className="no-results">No properties or tenants found.</div>
            )}
          </div>
        )}
      </div>

      <div className="property-section">
        <h2 className="section-title">My Properties</h2>
        <div className="property-list">
          {estateData.map((property) => {
            let totalFlats = 0;
            property.floors.forEach((f) => {
              totalFlats += f.flats.length;
            });
            return (
              <div
                key={property.id}
                className="property-card"
                onClick={() => setSelectedPropertyId(property.id)}
              >
                <div className="property-info">
                  <h3>{property.name}</h3>
                  <p>{totalFlats} Flats total</p>
                </div>
                <div className="property-status-wrapper">
                  <span className="arrow">→</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* DISCREET ADD PROPERTY BUTTON */}
        <div style={{ marginTop: "15px", textAlign: "right" }}>
          <button className="discreet-btn" onClick={handleAddProperty}>
            + add property
          </button>
        </div>
      </div>
    </>
  );

  if (!isLoggedIn) {
    return renderLoginView();
  }

  return (
    <div className="app-wrapper">
      <div className="main-container">
        {isRecordingPayment
          ? renderPaymentView()
          : isEditing || currentFloorForNewFlat !== null
          ? renderFlatFormView()
          : selectedFlat
          ? renderFlatDetailView()
          : selectedPropertyId
          ? renderBuildingView()
          : renderHomeView()}
      </div>
    </div>
  );
};

export default App;
