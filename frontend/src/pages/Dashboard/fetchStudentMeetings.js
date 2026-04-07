const fetchStudentMeetings = async (setMeetings, setMeetingsLoading) => {
  try {
    setMeetingsLoading(true);
    const token = localStorage.getItem("token");
    const response = await fetch('http://localhost:5000/api/meetings', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (response.ok) {
      const data = await response.json();
      setMeetings(data);
    }
  } catch (err) {
    console.error("Student meetings error:", err);
  } finally {
    setMeetingsLoading(false);
  }
};

export default fetchStudentMeetings;

