<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\Postulacion;
use App\Models\RequisitoVacante;

class PostulacionesController extends Controller
{
    public function show($id)
    {
        $p = Postulacion::findOrFail($id);

        $vacante = DB::table('vacantes')
            ->where('id_vacante', $p->id_vacante)
            ->first();

        $area = null;
        if ($vacante?->id_area) {
            $area = DB::connection('mysql_empleados')
                ->table('areas')
                ->where('id_area', $vacante->id_area)
                ->first();
        }

        $candidato = null;
        if ($p->id_candidato_externo) {
            $candidato = DB::table('candidatos_externos')
                ->where('id_candidato_externo', $p->id_candidato_externo)
                ->first();
        }

        $tipoCandidato = DB::table('cat_tipos_candidato')
            ->where('id_tipo_candidato', $p->id_tipo_candidato)
            ->first();

        $requisitos = RequisitoVacante::with('tipo')
            ->where('id_vacante', $p->id_vacante)
            ->get()
            ->map(fn($r) => [
                'id_requisito'    => $r->id_requisito,
                'descripcion'     => $r->descripcion,
                'nombre_tipo'     => $r->tipo?->nombre ?? '—',
                'peso_pct'        => $r->peso_pct,
            ]);

        return response()->json([
            'id_postulacion'     => $p->id_postulacion,
            'nombre_candidato'   => $candidato?->nombre ?? 'Candidato interno',
            'tipo_candidato'     => $tipoCandidato?->nombre ?? '—',
            'puntaje_automatico' => $p->puntaje_automatico,
            'id_vacante'         => $p->id_vacante,
            'titulo_vacante'     => $vacante?->titulo ?? '—',
            'nombre_area'        => $area?->nombre_area ?? '—',
            'requisitos'         => $requisitos,
        ]);
    }

    public function store(Request $request)
{
    $data = $request->validate([
        'id_vacante'           => 'required|integer|exists:vacantes,id_vacante',
        'id_candidato_externo' => 'required|integer|exists:candidatos_externos,id_candidato_externo',
    ]);

    DB::beginTransaction();
    try {
        $candidato = DB::table('candidatos_externos')
            ->where('id_candidato_externo', $data['id_candidato_externo'])
            ->first();

        $requisitos = RequisitoVacante::with('tipo')
            ->where('id_vacante', $data['id_vacante'])
            ->get();

        $puntaje = 0;
        $descartado = false;

        foreach ($requisitos as $req) {
            $tipo = strtolower($req->tipo?->nombre ?? '');
            $cumple = false;

            // Evaluar según tipo de requisito
            if (str_contains($tipo, 'experiencia')) {
                $minimo = intval($req->valor_minimo);
                $cumple = $candidato->anos_experiencia_automotriz >= $minimo;

                if ($cumple) {
                    $ideal = intval($req->valor_ideal);
                    $ratio = min($candidato->anos_experiencia_automotriz / max($ideal, 1), 1);
                    $puntaje += $ratio * $req->peso_pct;
                }

            } elseif (str_contains($tipo, 'certificaci')) {
                $cumple = $candidato->tiene_certificaciones;
                if ($cumple) $puntaje += $req->peso_pct;

            } elseif (str_contains($tipo, 'educaci') || str_contains($tipo, 'academ')) {
                $cumple = $candidato->id_nivel_academico >= 2;
                if ($cumple) $puntaje += $req->peso_pct;

            } elseif (str_contains($tipo, 'habilidad')) {
                // Habilidades se evalúan en entrevista
                $puntaje += $req->peso_pct * 0.5;
                $cumple = true;

            } else {
                // Tipo desconocido — puntaje parcial
                $puntaje += $req->peso_pct * 0.5;
                $cumple = true;
            }

            // Si es excluyente y no cumple → descartar
            if ($req->es_excluyente && !$cumple) {
                $descartado = true;
                break;
            }
        }

        $idTipoCandidato = DB::table('cat_tipos_candidato')
            ->where('nombre', 'Externo')->first();

        $idEstatusPostulacion = $descartado
            ? DB::table('cat_estatus_postulacion')->where('nombre', 'Descartado')->first()
            : DB::table('cat_estatus_postulacion')->where('nombre', 'Pendiente')->first();

        $postulacion = Postulacion::create([
            'id_vacante'             => $data['id_vacante'],
            'id_tipo_candidato'      => $idTipoCandidato->id_tipo_candidato,
            'id_candidato_externo'   => $data['id_candidato_externo'],
            'fecha_postulacion'      => now(),
            'id_estatus_postulacion' => $idEstatusPostulacion->id_estatus_postulacion,
            'puntaje_automatico'     => round($puntaje, 2),
            'fecha_ultimo_cambio'    => now(),
        ]);

        DB::commit();
        return response()->json([
            'id_postulacion'     => $postulacion->id_postulacion,
            'puntaje_automatico' => $postulacion->puntaje_automatico,
            'descartado'         => $descartado,
            'mensaje'            => $descartado
                ? 'Candidato descartado automáticamente por no cumplir requisito excluyente.'
                : 'Postulación registrada correctamente.',
        ], 201);

    } catch (\Exception $e) {
        DB::rollBack();
        return response()->json(['message' => 'Error: ' . $e->getMessage()], 500);
    }
}
}