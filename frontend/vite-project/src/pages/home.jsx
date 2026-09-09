import React, { useContext, useState } from 'react'
import withAuth from '../utils/withAuth'
import { useNavigate } from 'react-router-dom'
import "../App.css"
import { Button, IconButton, TextField } from '@mui/material'
import RestoreIcon from '@mui/icons-material/Restore'
import { AuthContext } from '../contexts/AuthContext'

function HomeComponent() {

    let navigate = useNavigate()
    const [meetingCode, setMeetingCode] = useState("")

    const { addToUserHistory } = useContext(AuthContext)

    let handleJoinVideoCall = async () => {
        await addToUserHistory(meetingCode)
        navigate(`/${meetingCode}`)
    }

    return (
        <>

            <div className="navBar">

                <div className="navBrand">
                    <h1>Vertexa</h1>
                </div>

                <div className="navRight">

                    <IconButton
                        onClick={() => {
                            navigate("/history")
                        }}
                        sx={{
                            color: "#ffffff",
                            "& .MuiSvgIcon-root": {
                                color: "#ffffff"
                            },
                            "&:hover": {
                                backgroundColor: "rgba(255, 255, 255, 0.10)"
                            }
                        }}
                    >
                        <RestoreIcon />
                    </IconButton>

                    <p>History</p>

                    <Button
                        className="logoutButton"
                        onClick={() => {
                            localStorage.removeItem("token")
                            navigate("/auth")
                        }}
                    >
                        Logout
                    </Button>

                </div>

            </div>


            <div className="meetContainer">

                <div className="leftPanel">

                    <div>

                        <h2 className="heroHeading">
                            Providing Quality Video Call Just Like{" "}
                            <span className="heroHighlight">Quality Education</span>
                        </h2>

                        <div className="joinForm">

                            <TextField
                                onChange={e => setMeetingCode(e.target.value)}
                                id="outlined-basic"
                                label="Meeting Code"
                                variant="outlined"
                            />

                            <Button
                                onClick={handleJoinVideoCall}
                                variant='contained'
                                className="joinButton"
                            >
                                Join
                            </Button>

                        </div>

                    </div>

                </div>

                <div className='rightPanel'>
                    <div className="phoneCard">
                        <img srcSet='/logo3.png' alt="Image" />
                    </div>
                </div>

            </div>

        </>
    )
}

export default withAuth(HomeComponent)
