import React, { useContext, useEffect, useState } from 'react'
import { AuthContext } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'

import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import { IconButton } from '@mui/material'
import HomeIcon from '@mui/icons-material/Home'

export default function History() {

    const { getHistoryOfUser } = useContext(AuthContext)

    const [meetings, setMeetings] = useState([])

    const routeTo = useNavigate()

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const history = await getHistoryOfUser()
                setMeetings(history)
            } catch {
                // IMPLEMENT SNACKBAR
            }
        }

        fetchHistory()
    }, [])

    let formatDate = (dateString) => {

        const date = new Date(dateString)

        const day = date.getDate().toString().padStart(2, "0")
        const month = (date.getMonth() + 1).toString().padStart(2, "0")
        const year = date.getFullYear()

        return `${day}/${month}/${year}`
    }

    return (
        <div style={{
            minHeight: "100vh",
            width: "100%",
            background: "#050a2b",
            color: "#ffffff",
            padding: "25px 50px",
            boxSizing: "border-box"
        }}>

            {/* HOME BUTTON */}
            <IconButton
                onClick={() => {
                    routeTo("/home")
                }}
                sx={{
                    color: "#ffffff",
                    background: "rgba(255,255,255,0.08)",
                    border: "1px solid rgba(255,255,255,0.15)",
                    borderRadius: "12px",
                    padding: "10px",
                    marginBottom: "30px",

                    "&:hover": {
                        background: "rgba(255,255,255,0.16)"
                    },

                    "& .MuiSvgIcon-root": {
                        color: "#ffffff",
                        fontSize: "30px"
                    }
                }}
            >
                <HomeIcon />
            </IconButton>

            {/* PAGE TITLE */}
            <Typography
                variant="h3"
                sx={{
                    color: "#ffffff",
                    fontWeight: 700,
                    marginBottom: "35px",
                    textAlign: "center"
                }}
            >
                Meeting History
            </Typography>

            {/* MEETINGS */}
            <div style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "22px",
                justifyContent: "center"
            }}>

                {
                    (meetings.length !== 0)
                        ? meetings.map((e, i) => {

                            return (

                                <Card
                                    key={i}
                                    variant="outlined"
                                    sx={{
                                        width: "300px",
                                        minHeight: "150px",
                                        background: "#101827",
                                        border: "1px solid rgba(255,255,255,0.12)",
                                        borderRadius: "18px",
                                        color: "#ffffff",
                                        boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
                                        transition: "0.2s",

                                        "&:hover": {
                                            transform: "translateY(-4px)",
                                            borderColor: "#1976d2",
                                            boxShadow: "0 12px 35px rgba(25,118,210,0.25)"
                                        }
                                    }}
                                >

                                    <CardContent sx={{ padding: "25px" }}>

                                        <Typography
                                            sx={{
                                                fontSize: "15px",
                                                color: "#93c5fd",
                                                marginBottom: "15px",
                                                fontWeight: 600
                                            }}
                                        >
                                            Meeting Code
                                        </Typography>

                                        <Typography
                                            sx={{
                                                fontSize: "22px",
                                                color: "#ffffff",
                                                fontWeight: 700,
                                                marginBottom: "20px",
                                                wordBreak: "break-word"
                                            }}
                                        >
                                            {e.meetingCode}
                                        </Typography>

                                        <Typography
                                            sx={{
                                                fontSize: "15px",
                                                color: "#cbd5e1"
                                            }}
                                        >
                                            Date:{" "}
                                            <span style={{
                                                color: "#ffffff",
                                                fontWeight: 600
                                            }}>
                                                {formatDate(e.date)}
                                            </span>
                                        </Typography>

                                    </CardContent>

                                </Card>

                            )
                        })

                        : (
                            <Typography
                                sx={{
                                    color: "#cbd5e1",
                                    fontSize: "18px",
                                    marginTop: "50px"
                                }}
                            >
                                No meeting history found.
                            </Typography>
                        )
                }

            </div>

        </div>
    )
}