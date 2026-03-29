<?php
namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Laravel\Sanctum\HasApiTokens;

class Empleado extends Authenticatable
{
    use HasApiTokens;

    protected $connection = 'mysql_empleados';
    protected $table = 'empleados';
    protected $primaryKey = 'id_empleado';

    protected $fillable = [
        'nombre',
        'email_corporativo',
        'password',
    ];

    protected $hidden = [
        'password',
    ];

    public function tokens(){
    return $this->morphMany(EmpleadoToken::class, 'tokenable');
    }
}
