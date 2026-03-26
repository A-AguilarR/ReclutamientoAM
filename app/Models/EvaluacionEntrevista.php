<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EvaluacionEntrevista extends Model
{
    protected $connection = 'pgsql';
    protected $table = 'evaluacion_entrevista';
    protected $primaryKey = 'id_evaluacion';
    public $timestamps = false;

    protected $fillable = [
        'id_postulacion',
        'id_evaluador',
        'fecha_entrevista',
        'id_recomendacion',
        'observaciones',
    ];

    public function detalles()
    {
        return $this->hasMany(DetalleEvaluacionEntrevista::class, 'id_evaluacion', 'id_evaluacion');
    }

    public function postulacion()
    {
        return $this->belongsTo(Postulacion::class, 'id_postulacion', 'id_postulacion');
    }
}