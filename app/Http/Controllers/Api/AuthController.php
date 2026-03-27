<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use App\Models\UsuarioSistema;

class AuthController extends Controller
{
    public function login(Request $request)
{
    $request->validate([
        'email'    => 'required|email',
        'password' => 'required|string',
    ]);

    $usuario = UsuarioSistema::with('rol')
        ->where('email', $request->email)
        ->first();

    if (!$usuario || !Hash::check($request->password, $usuario->password_hash)) {
        return response()->json(['message' => 'Credenciales incorrectas.'], 401);
    }

    if (!$usuario->activo) {
        return response()->json(['message' => 'Usuario inactivo.'], 403);
    }

    $token = $usuario->createToken('api')->plainTextToken;

    return response()->json([
        'token'   => $token,
        'usuario' => [
            'id_empleado'     => $usuario->id_empleado,
            'email'          => $usuario->email,
            'id_rol_usuario' => $usuario->id_rol_usuario,
            'nombreRol'      => $usuario->rol?->nombre,
        ]
    ]);
}

    public function me(Request $request)
{
    $usuario = $request->user()->load('rol');

    $empleado = null;
    if ($usuario->id_empleado) {
        $empleado = DB::connection('mysql_empleados')
            ->table('empleados')
            ->where('id_empleado', $usuario->id_empleado)
            ->first();
    }

    // Separar nombre en partes si viene completo
    $nombreCompleto = $empleado?->nombre ?? $usuario->email;
    $partes = explode(' ', trim($nombreCompleto));
    $nombre = $partes[0] ?? '';
    $ap     = $partes[1] ?? '';
    $am     = $partes[2] ?? '';

    return response()->json([
        'usuario' => [
            'id_usuario'     => $usuario->id_usuario,
            'email'          => $usuario->email,
            'id_rol_usuario' => $usuario->id_rol_usuario,
            'nombreRol'      => $usuario->rol?->nombre,
            'nombre'         => $nombre,
            'ap'             => $ap,
            'am'             => $am,
        ]
    ]);
}
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->noContent();
    }
}