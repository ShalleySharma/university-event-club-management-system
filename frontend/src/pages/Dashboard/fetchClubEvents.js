const fetchClubEvents = async (setClubEvents, setLoading, clubIds) => {
  setLoading(true);
  try {
    const token = localStorage.getItem("token");
    const response = await fetch("http://localhost:5000/api/events/club-events", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}` 
      },
      body: JSON.stringify({ clubIds })
    });
    if (response.ok) {
      const data = await response.json();
      setClubEvents(data);
    } else {
      console.error('Error fetching club events');
    }
  } catch (err) {
    console.error("Error fetching club events:", err);
  }
  setLoading(false);
};

export default fetchClubEvents;
