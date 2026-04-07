const fetchClubEvents = async (setClubEvents, setClubEventsLoading) => {
  try {
    setClubEventsLoading(true);
    const token = localStorage.getItem("token");
    const response = await fetch(`${process.env.REACT_APP_API_URL || 'https://university-event-club-management-system.onrender.com'}/api/events/club-events`, {
      method: 'POST',
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      setClubEvents(data);
    }
  } catch (err) {
    console.error("Club events error:", err);
  } finally {
    setClubEventsLoading(false);
  }
};

export default fetchClubEvents;
