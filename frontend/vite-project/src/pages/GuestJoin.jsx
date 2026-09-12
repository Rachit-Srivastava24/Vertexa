import React, { useState } from "react";
import { Button, TextField } from "@mui/material";
import { useNavigate } from "react-router-dom";

export default function GuestJoin() {
    const [meetingCode, setMeetingCode] = useState("");
    const navigate = useNavigate();

    const handleJoin = () => {
        if (!meetingCode.trim()) return;

        navigate(`/${meetingCode.trim()}`);
    };

    return (
        <div style={{
            minHeight: "100vh",
            background: "#050a2b",
            color: "white",
            display: "flex",
            justifyContent: "center",
            alignItems: "center"
        }}>
            <div style={{
                width: "90%",
                maxWidth: "450px",
                textAlign: "center"
            }}>
                <h1 style={{ marginBottom: "10px" }}>Vertexa</h1>

                <h2>Join Meeting as Guest</h2>

                <p style={{ color: "#cbd5e1", marginBottom: "30px" }}>
                    Enter the meeting code to join
                </p>

                <TextField
                    fullWidth
                    label="Meeting Code"
                    value={meetingCode}
                    onChange={(e) => setMeetingCode(e.target.value)}
                    variant="outlined"
                />

                <Button
                    fullWidth
                    variant="contained"
                    onClick={handleJoin}
                    sx={{
                        marginTop: "20px",
                        minHeight: "50px"
                    }}
                >
                    JOIN MEETING
                </Button>
            </div>
        </div>
    );
}