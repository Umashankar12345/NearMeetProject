package com.nearmeet

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import com.nearmeet.models.AuthRequest
import com.nearmeet.network.RetrofitClient
import com.nearmeet.ui.screens.*
import kotlinx.coroutines.launch

sealed class Screen {
    object Login : Screen()
    object Signup : Screen()
    object Home : Screen()
    object CreateEvent : Screen()
}

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            NearMeetTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    NearMeetApp()
                }
            }
        }
    }
}

@Composable
fun NearMeetTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = lightColorScheme(),
        content = content
    )
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun NearMeetApp() {
    var currentScreen by remember { mutableStateOf<Screen>(Screen.Login) }
    var authToken by remember { mutableStateOf<String?>(null) }
    var errorMessage by remember { mutableStateOf<String?>(null) }
    var isLoading by remember { mutableStateOf(false) }
    val coroutineScope = rememberCoroutineScope()
    val snackbarHostState = remember { SnackbarHostState() }

    Scaffold(
        snackbarHost = { SnackbarHost(snackbarHostState) }
    ) { paddingValues ->
        Box(modifier = Modifier.padding(paddingValues)) {
            when (currentScreen) {
                is Screen.Login -> {
                    LoginScreen(
                        onLoginClick = { email, password ->
                            if (email.isBlank() || password.isBlank()) {
                                coroutineScope.launch { snackbarHostState.showSnackbar("Please enter email and password") }
                                return@LoginScreen
                            }
                            coroutineScope.launch {
                                isLoading = true
                                try {
                                    val response = RetrofitClient.instance.login(AuthRequest(email = email, password = password))
                                    if (response.isSuccessful && response.body() != null) {
                                        authToken = response.body()!!.token
                                        currentScreen = Screen.Home
                                    } else {
                                        snackbarHostState.showSnackbar("Login failed: ${response.message()}")
                                    }
                                } catch (e: Exception) {
                                    snackbarHostState.showSnackbar("Error: ${e.localizedMessage}")
                                } finally {
                                    isLoading = false
                                }
                            }
                        },
                        onNavigateToSignup = { currentScreen = Screen.Signup }
                    )
                }
                is Screen.Signup -> {
                    SignupScreen(
                        onSignupClick = { name, email, password ->
                            if (name.isBlank() || email.isBlank() || password.isBlank()) {
                                coroutineScope.launch { snackbarHostState.showSnackbar("Please fill in all fields") }
                                return@SignupScreen
                            }
                            coroutineScope.launch {
                                isLoading = true
                                try {
                                    val response = RetrofitClient.instance.signup(AuthRequest(email = email, password = password, name = name))
                                    if (response.isSuccessful && response.body() != null) {
                                        authToken = response.body()!!.token
                                        currentScreen = Screen.Home
                                    } else {
                                        snackbarHostState.showSnackbar("Signup failed: ${response.message()}")
                                    }
                                } catch (e: Exception) {
                                    snackbarHostState.showSnackbar("Error: ${e.localizedMessage}")
                                } finally {
                                    isLoading = false
                                }
                            }
                        },
                        onNavigateToLogin = { currentScreen = Screen.Login }
                    )
                }
                is Screen.Home -> {
                    HomeScreen(
                        token = authToken ?: "",
                        onNavigateToCreateEvent = { currentScreen = Screen.CreateEvent },
                        onLogout = {
                            authToken = null
                            currentScreen = Screen.Login
                        }
                    )
                }
                is Screen.CreateEvent -> {
                    CreateEventScreen(
                        token = authToken ?: "",
                        onEventCreated = {
                            currentScreen = Screen.Home
                        },
                        onBack = { currentScreen = Screen.Home }
                    )
                }
            }

            if (isLoading) {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.scrim.copy(alpha = 0.3f)
                ) {
                    Box(modifier = Modifier.fillMaxSize()) {
                        CircularProgressIndicator(modifier = Modifier.align(Alignment.Center))
                    }
                }
            }
        }
    }
}
