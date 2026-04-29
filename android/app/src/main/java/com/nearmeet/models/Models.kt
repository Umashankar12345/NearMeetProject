package com.nearmeet.models

data class AuthRequest(
    val email: String,
    val password: String,
    val name: String? = null
)

data class AuthResponse(
    val _id: String,
    val name: String,
    val email: String,
    val token: String
)

data class Event(
    val _id: String,
    val title: String,
    val description: String,
    val location: LocationData,
    val date_time: String,
    val created_by: UserData
)

data class LocationData(
    val type: String,
    val coordinates: List<Double> // [longitude, latitude]
)

data class UserData(
    val _id: String,
    val name: String,
    val email: String
)
