<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DetalleEvaluacionEntrevista extends Model
{
    protected $connection = 'pgsql';
    protected $table = 'detalle_evaluacion_entrevista';
    protected $primaryKey = 'id_detalle';
    public $timestamps = false;

    protected $fillable = [
        'id_evaluacion',
        'id_requisito',
        'calificacion',
        'observacion',
    ];

    public function requisito()
    {
        return $this->belongsTo(RequisitoVacante::class, 'id_requisito', 'id_requisito');
    }
}