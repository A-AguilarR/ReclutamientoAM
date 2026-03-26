<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\EvaluacionEntrevista;
use App\Models\DetalleEvaluacionEntrevista;
use App\Models\Postulacion;
use App\Models\RequisitoVacante;

class EvaluacionesEntrevistaController extends Controller
{
    public function store(Request $request)
    {
        $data = $request->validate([
            'id_postulacion'   => 'required|integer|exists:postulaciones,id_postulacion',
            'fecha_entrevista' => 'required|date',
            'id_recomendacion' => 'required|integer|exists:cat_recomendaciones_entrevista,id_recomendacion',
            'observaciones'    => 'nullable|string',
            'detalles'         => 'required|array|min:1',
            'detalles.*.id_requisito' => 'required|integer',
            'detalles.*.calificacion' => 'required|integer|min:1|max:5',
            'detalles.*.observacion'  => 'nullable|string',
        ]);

        DB::beginTransaction();
        try {
            // Crear evaluación
            $evaluacion = EvaluacionEntrevista::create([
                'id_postulacion'   => $data['id_postulacion'],
                'id_evaluador'     => $request->user()->id_usuario,
                'fecha_entrevista' => $data['fecha_entrevista'],
                'id_recomendacion' => $data['id_recomendacion'],
                'observaciones'    => $data['observaciones'] ?? null,
            ]);

            // Guardar detalles
            foreach ($data['detalles'] as $detalle) {
                DetalleEvaluacionEntrevista::create([
                    'id_evaluacion' => $evaluacion->id_evaluacion,
                    'id_requisito'  => $detalle['id_requisito'],
                    'calificacion'  => $detalle['calificacion'],
                    'observacion'   => $detalle['observacion'] ?? null,
                ]);
            }

            // Calcular puntaje_entrevista
            $postulacion = Postulacion::findOrFail($data['id_postulacion']);
            $requisitos  = RequisitoVacante::where('id_vacante', $postulacion->id_vacante)->get()->keyBy('id_requisito');

            $puntajeEntrevista = 0;
            foreach ($data['detalles'] as $detalle) {
                $requisito = $requisitos->get($detalle['id_requisito']);
                if (!$requisito) continue;

                // calificacion 1-5 normalizada * peso del requisito
                $puntajeEntrevista += ($detalle['calificacion'] / 5) * $requisito->peso_pct;
            }

            // Actualizar puntajes en postulacion
            $postulacion->puntaje_entrevista = round($puntajeEntrevista, 2);
            $postulacion->puntaje_final = round(
                ($postulacion->puntaje_automatico + $puntajeEntrevista) / 2, 2
            );
            $postulacion->save();

            DB::commit();
            return response()->json([
                'id_evaluacion'     => $evaluacion->id_evaluacion,
                'puntaje_entrevista' => $postulacion->puntaje_entrevista,
                'puntaje_final'     => $postulacion->puntaje_final,
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Error: ' . $e->getMessage()], 500);
        }
    }

    public function show($id)
    {
        $evaluacion = EvaluacionEntrevista::with(['detalles.requisito'])
            ->where('id_postulacion', $id)
            ->first();

        if (!$evaluacion) {
            return response()->json(['message' => 'Sin evaluación registrada.'], 404);
        }

        return response()->json($evaluacion);
    }
}