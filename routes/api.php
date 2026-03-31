<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\VacantesController;
use App\Http\Controllers\Api\CatalogosController;
use App\Http\Controllers\Api\EvaluacionesEntrevistaController;
use App\Http\Controllers\Api\PostulacionesController;
use App\Http\Controllers\Api\CandidatoExternoController;

Route::get('/vacantes', [VacantesController::class, 'index']);

Route::post('/register-externo', [CandidatoExternoController::class, 'register']);

Route::post('/login', [AuthController::class, 'login']);
Route::post('/login-externo', [CandidatoExternoController::class, 'loginExterno']);
Route::post('/login-empleado', [AuthController::class, 'loginEmpleado']);

Route::prefix('externo')->group(function(){
    Route::get('/vacantes/{id}',[VacantesController::class, 'show']);
});


Route::middleware('auth:sanctum')->group(function () {

    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);

    
    Route::get('/vacantes/resumen', [VacantesController::class, 'resumen']);
    Route::get('/vacantes/{id}',[VacantesController::class,'show']);
    
    Route::get('/alertas', [VacantesController::class, 'alertas']);
    Route::get('/vacantes/{id}/ranking', [VacantesController::class, 'ranking']);
    Route::patch('/vacantes/{id}/estatus', [VacantesController::class, 'actualizarEstatus']);
    Route::patch('/vacantes/{id}/flujo-externo', [VacantesController::class, 'flujoExterno']);
    Route::post('/vacantes', [VacantesController::class, 'store']);
    Route::delete('/vacantes/{id}', [VacantesController::class, 'destroy']);
    Route::post('/evaluaciones-entrevista', [EvaluacionesEntrevistaController::class, 'store']);
    Route::get('/evaluaciones-entrevista/{id}', [EvaluacionesEntrevistaController::class, 'show']);
    Route::get('/postulaciones/{id}', [PostulacionesController::class, 'show']);
    Route::post('/postulaciones', [PostulacionesController::class, 'store']);
    Route::patch('/postulaciones/{id}/estatus', [PostulacionesController::class, 'actualizarEstatus']);
    Route::get('/graficas', [VacantesController::class, 'graficas']);
    Route::get('/vacantes/{id}/graficas', [VacantesController::class, 'graficasVacante']);
    Route::put('/vacantes/{id}', [VacantesController::class, 'update']);
    Route::post('/postulaciones/interno', [PostulacionesController::class, 'storeInterno']);
    //Route::get('/vacantes-elegibles', [VacantesController::class, 'vacantesElegibles']);
    

    Route::middleware(\App\Http\Middleware\EmpleadoAuth::class)->group(function () {
    Route::get('/vacantes-elegibles', [VacantesController::class, 'vacantesElegibles']);
    Route::patch('/postulaciones/{id}/respuesta-empleado', [PostulacionesController::class, 'respuestaEmpleado']);
});

    Route::get('/candidatos-externos', [CandidatoExternoController::class, 'listarCandidatos']);
    //Route::patch('/postulaciones/{id}/respuesta-empleado', [PostulacionesController::class, 'respuestaEmpleado']);
    Route::post('/externo/postulaciones', [CandidatoExternoController::class, 'postular']);
    
    Route::get('/mis-postulaciones', [EmpleadoController::class, 'misPostulaciones']);
    Route::delete('/mis-postulaciones/{id}', [EmpleadoController::class, 'abandonarPostulacion']);
    
    Route::get('/mis-postulaciones', [CandidatoExternoController::class, 'misPostulaciones']);
    Route::delete('/mis-postulaciones/{id}', [CandidatoExternoController::class, 'abandonarPostulacion']);


    // Catálogos
    Route::prefix('catalogos')->group(function () {
        Route::get('/areas', [CatalogosController::class, 'areas']);
        Route::get('/tipos-requisito', [CatalogosController::class, 'tiposRequisito']);
        Route::get('/estatus-vacante', [CatalogosController::class, 'estatusVacante']);
        Route::get('/estatus-postulacion', [CatalogosController::class, 'estatusPostulacion']);
        Route::get('/recomendaciones-entrevista', [CatalogosController::class, 'recomendacionesEntrevista']);
    });
});

Route::get('/vacantes-elegibles', function(\Illuminate\Http\Request $request) {
    $bearerToken = $request->bearerToken();
    if (!$bearerToken) return response()->json(['message' => 'Unauthenticated.'], 401);

    $parts = explode('|', $bearerToken, 2);
    if (count($parts) !== 2) return response()->json(['message' => 'Unauthenticated.'], 401);

    [$id, $plain] = $parts;
    $tokenModel = \App\Models\EmpleadoToken::find($id);

    if (!$tokenModel || !hash_equals($tokenModel->token, hash('sha256', $plain))) {
        return response()->json(['message' => 'Unauthenticated.'], 401);
    }

    $request->setUserResolver(fn() => $tokenModel->tokenable);

    return app(\App\Http\Controllers\Api\VacantesController::class)->vacantesElegibles($request);
});

Route::patch('/postulaciones/{id}/respuesta-empleado', function(\Illuminate\Http\Request $request, $id) {
    $bearerToken = $request->bearerToken();
    if (!$bearerToken) return response()->json(['message' => 'Unauthenticated.'], 401);

    $parts = explode('|', $bearerToken, 2);
    if (count($parts) !== 2) return response()->json(['message' => 'Unauthenticated.'], 401);

    [$idToken, $plain] = $parts;
    $tokenModel = \App\Models\EmpleadoToken::find($idToken);

    if (!$tokenModel || !hash_equals($tokenModel->token, hash('sha256', $plain))) {
        return response()->json(['message' => 'Unauthenticated.'], 401);
    }

    $request->setUserResolver(fn() => $tokenModel->tokenable);

    return app(\App\Http\Controllers\Api\PostulacionesController::class)->respuestaEmpleado($request, $id);
});