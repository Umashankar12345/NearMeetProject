package com.nearmeet.network

import com.nearmeet.models.AuthRequest
import com.nearmeet.models.AuthResponse
import com.nearmeet.models.Event
import com.nearmeet.models.EventCreateRequest
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.Header
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.Query

interface ApiService {
    @POST("auth/login")
    suspend fun login(@Body request: AuthRequest): Response<AuthResponse>

    @POST("auth/signup")
    suspend fun signup(@Body request: AuthRequest): Response<AuthResponse>

    @GET("events/nearby")
    suspend fun getNearbyEvents(
        @Query("latitude") lat: Double,
        @Query("longitude") lng: Double,
        @Query("distance") distance: Int = 5000
    ): Response<List<Event>>

    @POST("events")
    suspend fun createEvent(
        @Header("Authorization") token: String,
        @Body request: EventCreateRequest
    ): Response<Event>
}
