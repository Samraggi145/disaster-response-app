import React, { useState, useEffect } from "react";
import { db } from "./firebase";
import {
  collection,
  addDoc,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";

// 🗺️ MAP
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";

// 🚨 FIX MARKER ICON
import L from "leaflet";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

function App() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("");

  const [form, setForm] = useState({
    name: "",
    location: "",
    message: "",
    type: "",
    priority: "",
  });

  // 🔥 REAL-TIME DATA
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "reports"), (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      data.sort((a, b) => {
        return (b.time?.seconds || 0) - (a.time?.seconds || 0);
      });

      setReports(data);
    });

    return () => unsubscribe();
  }, []);

  // 🔍 FILTER
  const filteredReports = filter
    ? reports.filter((r) =>
        r.type?.toLowerCase().includes(filter.toLowerCase())
      )
    : reports;

  // 🧠 PRECAUTIONS FUNCTION (🔥 NEW FEATURE)
  const getPrecautions = (type, priority) => {
    if (!type) return "";

    const precautions = {
      flood: "Move to higher ground, avoid water, keep emergency kit ready.",
      fire: "Evacuate immediately, avoid smoke, call emergency services.",
      earthquake: "Drop, cover, hold. Stay away from buildings.",
      cyclone: "Stay indoors, avoid windows, stock essentials.",
    };

    let base = precautions[type.toLowerCase()] || "Stay safe and alert.";

    if (priority === "High") {
      base += " 🚨 URGENT: Take action immediately!";
    }

    return base;
  };

  // 🌍 SUBMIT
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name || !form.location || !form.message) {
      alert("Fill all fields");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${form.location}`,
        {
          headers: { "User-Agent": "CrisisCore-App" },
        }
      );

      const data = await res.json();

      if (data.length === 0) {
        alert("Location not found");
        setLoading(false);
        return;
      }

      const lat = parseFloat(data[0].lat);
      const lng = parseFloat(data[0].lon);

      await addDoc(collection(db, "reports"), {
        ...form,
        lat,
        lng,
        time: serverTimestamp(),
      });

      setForm({
        name: "",
        location: "",
        message: "",
        type: "",
        priority: "",
      });

      setLoading(false);

    } catch (err) {
      console.error(err);
      alert("Error");
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial" }}>
      <h1 style={{ color: "red" }}>🚨 CrisisCore</h1>

      {/* FORM */}
      <form onSubmit={handleSubmit}>
        <input
          placeholder="Name"
          value={form.name}
          onChange={(e) =>
            setForm({ ...form, name: e.target.value })
          }
        />

        <input
          placeholder="Location"
          value={form.location}
          onChange={(e) =>
            setForm({ ...form, location: e.target.value })
          }
        />

        <input
          placeholder="Message"
          value={form.message}
          onChange={(e) =>
            setForm({ ...form, message: e.target.value })
          }
        />

        {/* TYPE */}
        <select
          value={form.type}
          onChange={(e) =>
            setForm({ ...form, type: e.target.value })
          }
        >
          <option value="">Type</option>
          <option value="Flood">Flood</option>
          <option value="Fire">Fire</option>
          <option value="Earthquake">Earthquake</option>
          <option value="Cyclone">Cyclone</option>
        </select>

        {/* PRIORITY */}
        <select
          value={form.priority}
          onChange={(e) =>
            setForm({ ...form, priority: e.target.value })
          }
        >
          <option value="">Priority</option>
          <option value="High">🔴 High</option>
          <option value="Medium">🟠 Medium</option>
          <option value="Low">🟢 Low</option>
        </select>

        <button type="submit">
          {loading ? "Submitting..." : "Report"}
        </button>
      </form>

      {/* FILTER */}
      <h3>🔍 Filter</h3>
      <select onChange={(e) => setFilter(e.target.value)}>
        <option value="">All</option>
        <option value="Flood">Flood</option>
        <option value="Fire">Fire</option>
        <option value="Earthquake">Earthquake</option>
        <option value="Cyclone">Cyclone</option>
      </select>

      {/* REPORTS */}
      <h2>📍 Live Reports</h2>

      {filteredReports.map((r) => (
        <div
          key={r.id}
          style={{
            border: "1px solid black",
            margin: "10px",
            padding: "10px",
          }}
        >
          <p><b>{r.name}</b></p>
          <p>{r.location}</p>
          <p>{r.message}</p>

          <p>⚠️ Type: {r.type}</p>
          <p>Priority: {r.priority}</p>

          {/* 🔥 PRECAUTIONS */}
          <p style={{ color: "green" }}>
            🛡️ Precautions: {getPrecautions(r.type, r.priority)}
          </p>

          <small>
            {r.time?.seconds
              ? new Date(r.time.seconds * 1000).toLocaleString()
              : ""}
          </small>

          <p>
            Lat: {r.lat} | Lng: {r.lng}
          </p>
        </div>
      ))}

      {/* MAP */}
      <h2>🗺️ Disaster Map</h2>

      <MapContainer
        center={[20.5937, 78.9629]}
        zoom={6}
        style={{ height: "400px" }}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        {filteredReports.map((r) =>
          r.lat && r.lng ? (
            <Marker
              key={r.id}
              position={[parseFloat(r.lat), parseFloat(r.lng)]}
            >
              <Popup>
                <b>{r.name}</b><br />
                {r.location}<br />
                {r.type}
              </Popup>
            </Marker>
          ) : null
        )}
      </MapContainer>
    </div>
  );
}

export default App;