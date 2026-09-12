import * as React from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import Avatar from "@mui/material/Avatar";
import Button from "@mui/material/Button";
import CssBaseline from "@mui/material/CssBaseline";
import TextField from "@mui/material/TextField";
import Paper from "@mui/material/Paper";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import HomeIcon from "@mui/icons-material/Home";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { IconButton, Snackbar } from "@mui/material";
import { AuthContext } from "../contexts/AuthContext";

const darkTheme = createTheme({
    palette: {
        mode: "dark",
        primary: {
            main: "#a855f7",
        },
        secondary: {
            main: "#7c3aed",
        },
        background: {
            paper: "#140c28",
        },
    },
});

export default function Authentication() {

    const routeTo = useNavigate();

    const [username, setUsername] = React.useState("");
    const [password, setPassword] = React.useState("");
    const [name, setName] = React.useState("");
    const [error, setError] = React.useState("");
    const [message, setMessage] = React.useState("");
    const [email, setEmail] = React.useState("");
const [otp, setOtp] = React.useState("");
const [otpSent, setOtpSent] = React.useState(false);

    const [searchParams] = useSearchParams();
    const initialMode = searchParams.get("mode") === "register" ? 1 : 0;

    const [formState, setFormState] = React.useState(initialMode);
    const [open, setOpen] = React.useState(false);

    const { handleRegister, handleLogin, sendOtp, verifyOtp } =
        React.useContext(AuthContext);

    const handleAuth = async () => {
    try {
        setError("");

        if (formState === 0) {
            await handleLogin(username, password);
        } else {

            if (!otpSent) {
                const result = await sendOtp(
                    name,
                    username,
                    email,
                    password
                );

                setMessage(result);
                setOpen(true);
                setOtpSent(true);

            } else {
                const result = await verifyOtp(email, otp);

                localStorage.setItem("token", result);

                setMessage(result);
                setOpen(true);

                setUsername("");
                setPassword("");
                setName("");
                setEmail("");
                setOtp("");
                setOtpSent(false);

                setFormState(0);
            }
        }
    } catch (err) {
        console.log(err);

        const errorMessage =
            err.response?.data?.message ||
            err.message ||
            "Something went wrong";

        setError(errorMessage);
    }
};

    return (
        <ThemeProvider theme={darkTheme}>
            <CssBaseline />

            <Grid
                container
                component="main"
                sx={{
                    minHeight: "100vh",
                    background:
                        "radial-gradient(circle at 80% 10%, rgba(168, 85, 247, 0.18) 0%, transparent 45%), radial-gradient(circle at 10% 90%, rgba(88, 28, 135, 0.20) 0%, transparent 50%), #05030e",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    position: "relative",
                }}
            >

                {/* HOME BUTTON */}

                <IconButton
                    onClick={() => routeTo("/")}
                    sx={{
                        position: "absolute",
                        top: 25,
                        left: 25,
                        color: "#ffffff",
                        background: "rgba(255,255,255,0.08)",
                        border: "1px solid rgba(255,255,255,0.15)",
                        borderRadius: "12px",
                        padding: "10px",

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

                {/* LOGIN CARD */}

                <Paper
                    elevation={10}
                    sx={{
                        position: "relative",
                        zIndex: 1,
                        width: {
                            xs: "90%",
                            sm: 450,
                        },
                        padding: {
                            xs: 3,
                            sm: 4,
                        },
                        borderRadius: 4,
                        backgroundColor: "rgba(20, 12, 40, 0.85)",
                        backdropFilter: "blur(16px)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
                    }}
                >

                    <Box
                        sx={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                        }}
                    >

                        {/* LOCK ICON */}

                        <Avatar
                            sx={{
                                m: 1,
                                background: "linear-gradient(135deg, #a855f7, #7c3aed)",
                                width: 55,
                                height: 55,
                            }}
                        >
                            <LockOutlinedIcon />
                        </Avatar>

                        {/* SIGN IN / SIGN UP */}

                        <Box
                            sx={{
                                display: "flex",
                                gap: 1,
                                mt: 1,
                                mb: 2,
                            }}
                        >

                            <Button
                                variant={
                                    formState === 0
                                        ? "contained"
                                        : "text"
                                }
                                sx={
                                    formState === 0
                                        ? { background: "linear-gradient(135deg, #a855f7, #7c3aed)" }
                                        : { color: "rgba(255,255,255,0.7)" }
                                }
                                onClick={() => {
                                    setFormState(0);
                                    setError("");
                                }}
                            >
                                Sign In
                            </Button>

                            <Button
                                variant={
                                    formState === 1
                                        ? "contained"
                                        : "text"
                                }
                                sx={
                                    formState === 1
                                        ? { background: "linear-gradient(135deg, #a855f7, #7c3aed)" }
                                        : { color: "rgba(255,255,255,0.7)" }
                                }
                                onClick={() => {
                                    setFormState(1);
                                    setError("");
                                }}
                            >
                                Sign Up
                            </Button>

                        </Box>

                        {/* FORM */}

                        <Box
                            component="form"
                            noValidate
                            sx={{
                                width: "100%",
                            }}
                        >

                            {/* NAME - ONLY SIGN UP */}

                            {formState === 1 && (
                                <TextField
                                    margin="normal"
                                    required
                                    fullWidth
                                    id="name"
                                    label="Full Name"
                                    name="name"
                                    value={name}
                                    autoFocus
                                    onChange={(e) =>
                                        setName(e.target.value)
                                    }
                                />
                            )}

{formState === 1 && (
    <TextField
        margin="normal"
        required
        fullWidth
        id="email"
        label="Email"
        name="email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
    />
)}
                            {/* USERNAME */}

                            <TextField
                                margin="normal"
                                required
                                fullWidth
                                id="username"
                                label="Username"
                                name="username"
                                value={username}
                                autoFocus={formState === 0}
                                onChange={(e) =>
                                    setUsername(e.target.value)
                                }
                            />

                            {/* PASSWORD */}

                            <TextField
                                margin="normal"
                                required
                                fullWidth
                                id="password"
                                name="password"
                                label="Password"
                                type="password"
                                value={password}
                                onChange={(e) =>
                                    setPassword(e.target.value)
                                }
                            />

                            {formState === 1 && otpSent && (
    <TextField
        margin="normal"
        required
        fullWidth
        id="otp"
        label="Enter OTP"
        name="otp"
        value={otp}
        onChange={(e) => setOtp(e.target.value)}
    />
)}

                            {/* ERROR */}

                            {error && (
                                <Box
                                    sx={{
                                        color: "#ff6b6b",
                                        fontSize: "14px",
                                        mt: 1,
                                    }}
                                >
                                    {error}
                                </Box>
                            )}

                            {/* LOGIN / REGISTER BUTTON */}

                            <Button
                                type="button"
                                fullWidth
                                variant="contained"
                                sx={{
                                    mt: 3,
                                    mb: 1,
                                    height: 48,
                                    background: "linear-gradient(135deg, #a855f7, #7c3aed)",
                                    fontWeight: 600,
                                    "&:hover": {
                                        background: "linear-gradient(135deg, #9333ea, #6d28d9)",
                                    },
                                }}
                                onClick={handleAuth}
                            >
                                {formState === 0
    ? "LOGIN"
    : otpSent
        ? "VERIFY OTP"
        : "SEND OTP"}
                            </Button>

                        </Box>

                    </Box>

                </Paper>

                {/* SUCCESS SNACKBAR */}

                <Snackbar
                    open={open}
                    autoHideDuration={4000}
                    onClose={() => setOpen(false)}
                    message={message}
                />

            </Grid>
        </ThemeProvider>
    );
}