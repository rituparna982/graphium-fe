# Flutter Collaboration App Frontend Guide

This guide contains the Flutter implementation for your fully functional collaboration app flow based on the provided backend endpoints (`/api/flutter/...`). It uses **Riverpod** for state management and **Dio** for handling API requests.

> **Note:** Ensure you have added the required packages in your `pubspec.yaml`:
> ```yaml
> dependencies:
>   flutter:
>     sdk: flutter
>   flutter_riverpod: ^2.4.9
>   dio: ^5.4.0
>   shared_preferences: ^2.2.2
> ```

---

## 1. API Client Setup (Dio)

Create `api_client.dart` to manage the base HTTP connection and add Auth Token interceptors.

```dart
import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

final dioProvider = Provider<Dio>((ref) {
  final dio = Dio(BaseOptions(
    baseUrl: 'http://localhost:3001/api/flutter', // Update with your Node backend IP
    connectTimeout: const Duration(seconds: 10),
    receiveTimeout: const Duration(seconds: 10),
  ));

  dio.interceptors.add(InterceptorsWrapper(
    onRequest: (options, handler) async {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('jwt_token'); // Make sure your login flow saves the JWT Token here
      if (token != null) {
        options.headers['Authorization'] = 'Bearer $token'; // JWT Token Integration
      }
      return handler.next(options);
    },
  ));

  return dio;
});
```

---

## 2. Models

Create `models.dart` to map JSON from the Node API.

```dart
class User {
  final String id;
  final String name;
  final String email;
  final String bio;
  final String profilePic;
  final List<String> skills;
  final bool? previousCollaborations;

  User({
    required this.id,
    required this.name,
    required this.email,
    required this.bio,
    required this.profilePic,
    required this.skills,
    this.previousCollaborations,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'] ?? '',
      name: json['name'] ?? '',
      email: json['email'] ?? '',
      bio: json['bio'] ?? '',
      profilePic: json['profilePic'] ?? '',
      skills: List<String>.from(json['skills'] ?? []),
      previousCollaborations: json['previousCollaborations'],
    );
  }
}

class CollabRequest {
  final String id;
  final User? sender;
  final String status;
  final DateTime timestamp;

  CollabRequest({
    required this.id,
    this.sender,
    required this.status,
    required this.timestamp,
  });

  factory CollabRequest.fromJson(Map<String, dynamic> json) {
    return CollabRequest(
      id: json['id'] ?? '',
      sender: json['sender'] != null ? User.fromJson(json['sender']) : null,
      status: json['status'] ?? 'pending',
      timestamp: DateTime.parse(json['timestamp']),
    );
  }
}
```

---

## 3. Providers & State Management (Riverpod)

Create `providers.dart`.

```dart
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:dio/dio.dart';
import 'models.dart';
import 'api_client.dart';

// GET all users
final usersProvider = FutureProvider<List<User>>((ref) async {
  final dio = ref.read(dioProvider);
  final response = await dio.get('/users');
  return (response.data as List).map((e) => User.fromJson(e)).toList();
});

// GET user profile by ID
final userProfileProvider = FutureProvider.family<User, String>((ref, userId) async {
  final dio = ref.read(dioProvider);
  final response = await dio.get('/users/$userId');
  return User.fromJson(response.data);
});

// GET Incoming Collab requests
final collabRequestsProvider = FutureProvider<List<CollabRequest>>((ref) async {
  final dio = ref.read(dioProvider);
  final response = await dio.get('/collab-requests');
  return (response.data as List).map((e) => CollabRequest.fromJson(e)).toList();
});
```

---

## 4. UI: Collaboration Screen

```dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'providers.dart';
import 'user_profile_screen.dart';

class CollaborationScreen extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final usersAsync = ref.watch(usersProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Collaboration')),
      body: usersAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, stack) => Center(child: Text('Error: $err')),
        data: (users) {
          if (users.isEmpty) return const Center(child: Text("No users found"));

          return ListView.builder(
            itemCount: users.length,
            itemBuilder: (context, index) {
              final user = users[index];
              return Card(
                child: ListTile(
                  leading: GestureDetector(
                    onTap: () {
                      // Navigate to Profile Screen when profile pic is tapped
                      Navigator.push(context, MaterialPageRoute(
                        builder: (_) => UserProfileScreen(userId: user.id),
                      ));
                    },
                    child: CircleAvatar(
                      backgroundImage: user.profilePic.isNotEmpty
                          ? NetworkImage(user.profilePic)
                          : null,
                      child: user.profilePic.isEmpty ? const Icon(Icons.person) : null,
                    ),
                  ),
                  title: Text(user.name),
                  // Short bio
                  subtitle: Text(user.bio.isNotEmpty ? user.bio : "No bio available", maxLines: 1),
                  trailing: const Icon(Icons.arrow_forward_ios, size: 16),
                ),
              );
            },
          );
        },
      ),
    );
  }
}
```

---

## 5. UI: User Profile & Request Button

```dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:dio/dio.dart';
import 'providers.dart';
import 'api_client.dart';

class UserProfileScreen extends ConsumerWidget {
  final String userId;

  const UserProfileScreen({required this.userId, Key? key}) : super(key: key);

  void sendCollabRequest(BuildContext context, WidgetRef ref) async {
    try {
      final dio = ref.read(dioProvider);
      await dio.post('/collab-request', data: {'receiver_id': userId});
      
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Request sent successfully!')),
      );
    } on DioException catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: ${e.response?.data['error'] ?? 'Failed to send'}')),
      );
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final userAsync = ref.watch(userProfileProvider(userId));

    return Scaffold(
      appBar: AppBar(title: const Text('Profile')),
      body: userAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, stack) => Center(child: Text('Error: $err')),
        data: (user) {
          return Padding(
            padding: const EdgeInsets.all(16.0),
            child: ListView(
              children: [
                CircleAvatar(
                  radius: 50,
                  backgroundImage: user.profilePic.isNotEmpty
                      ? NetworkImage(user.profilePic) : null,
                  child: user.profilePic.isEmpty ? const Icon(Icons.person, size: 50) : null,
                ),
                const SizedBox(height: 16),
                Text(user.name, style: Theme.of(context).textTheme.headlineMedium, textAlign: TextAlign.center),
                // Email visibility
                if (user.email.isNotEmpty)
                  Text(user.email, style: Theme.of(context).textTheme.bodyMedium, textAlign: TextAlign.center),
                
                const SizedBox(height: 16),
                const Text('Bio', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
                Text(user.bio.isNotEmpty ? user.bio : 'No bio'),

                const SizedBox(height: 16),
                const Text('Skills', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
                Wrap(
                  spacing: 8.0,
                  children: user.skills.map((s) => Chip(label: Text(s))).toList(),
                ),

                // Show Previous Collaborations status
                if (user.previousCollaborations == true) ...[
                  const SizedBox(height: 16),
                  const Text('✅ You have previously collaborated with this user.',
                      style: TextStyle(color: Colors.green)),
                ],

                const SizedBox(height: 24),
                // Request Collaboration Button
                ElevatedButton(
                  onPressed: () => sendCollabRequest(context, ref),
                  child: const Text('Request Collaboration'),
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}
```

---

## 6. UI: My Profile (Incoming Requests Section)

```dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:dio/dio.dart';
import 'providers.dart';
import 'api_client.dart';

class MyProfileRequestsScreen extends ConsumerWidget {
  
  void updateRequestStatus(BuildContext context, WidgetRef ref, String reqId, String status) async {
    try {
      final dio = ref.read(dioProvider);
      await dio.put('/collab-request/$reqId', data: {'status': status});
      
      // Refresh provider state so UI updates instantly
      ref.invalidate(collabRequestsProvider);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Request $status successfully!')),
      );
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Failed to update request status')),
      );
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final requestsAsync = ref.watch(collabRequestsProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Incoming Collaboration Requests')),
      body: requestsAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, stack) => Center(child: Text('Error: $err')),
        data: (requests) {
          if (requests.isEmpty) {
            return const Center(child: Text('No incoming requests right now.'));
          }
          return ListView.builder(
            itemCount: requests.length,
            itemBuilder: (context, index) {
              final req = requests[index];
              final sender = req.sender;
              if (sender == null) return const SizedBox.shrink();

              return ListTile(
                leading: CircleAvatar(
                  backgroundImage: sender.profilePic.isNotEmpty
                      ? NetworkImage(sender.profilePic) : null,
                  child: sender.profilePic.isEmpty ? const Icon(Icons.person) : null,
                ),
                title: Text('${sender.name} wants to collaborate!'),
                subtitle: Text('Status: ${req.status}'),
                trailing: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    // Accept Button
                    IconButton(
                      icon: const Icon(Icons.check, color: Colors.green),
                      tooltip: 'Accept',
                      onPressed: () => updateRequestStatus(context, ref, req.id, 'accepted'),
                    ),
                    // Reject Button
                    IconButton(
                      icon: const Icon(Icons.close, color: Colors.red),
                      tooltip: 'Reject',
                      onPressed: () => updateRequestStatus(context, ref, req.id, 'rejected'),
                    ),
                  ],
                ),
              );
            },
          );
        },
      ),
    );
  }
}
```

---

## 7. UI: Settings UI (Update Email, Password, Profile)

```dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:dio/dio.dart';
import 'api_client.dart';

class SettingsScreen extends ConsumerStatefulWidget {
  @override
  _SettingsScreenState createState() => _SettingsScreenState();
}

class _SettingsScreenState extends ConsumerState<SettingsScreen> {
  final emailController = TextEditingController();
  final passwordController = TextEditingController();
  final nameController = TextEditingController();
  final bioController = TextEditingController();

  Future<void> updateConfig(String methodUrl, Map<String, dynamic> data) async {
    try {
      final dio = ref.read(dioProvider);
      await dio.put(methodUrl, data: data);
      
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Successfully updated!')),
      );
    } on DioException catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: ${e.response?.data['error'] ?? e.message}')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Settings')),
      body: ListView(
        padding: const EdgeInsets.all(16.0),
        children: [
          // Update Profile
          const Text('Update Profile', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
          const SizedBox(height: 8),
          TextField(controller: nameController, decoration: const InputDecoration(labelText: 'Name', border: OutlineInputBorder())),
          const SizedBox(height: 8),
          TextField(controller: bioController, decoration: const InputDecoration(labelText: 'Bio', border: OutlineInputBorder())),
          const SizedBox(height: 8),
          ElevatedButton(
            onPressed: () => updateConfig('/update-profile', {'name': nameController.text, 'bio': bioController.text}),
            child: const Text('Save Profile Changes'),
          ),

          const Divider(height: 40),
          // Update Email
          const Text('Change Email', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
          const SizedBox(height: 8),
          TextField(controller: emailController, decoration: const InputDecoration(labelText: 'New Email', border: OutlineInputBorder())),
          const SizedBox(height: 8),
          ElevatedButton(
            onPressed: () => updateConfig('/update-email', {'email': emailController.text}),
            child: const Text('Update Email'),
          ),

          const Divider(height: 40),
          // Update Password
          const Text('Change Password', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
          const SizedBox(height: 8),
          TextField(controller: passwordController, obscureText: true, decoration: const InputDecoration(labelText: 'New Password', border: OutlineInputBorder())),
          const SizedBox(height: 8),
          ElevatedButton(
            onPressed: () => updateConfig('/update-password', {'password': passwordController.text}),
            child: const Text('Update Password'),
          ),
        ],
      ),
    );
  }
}
```
