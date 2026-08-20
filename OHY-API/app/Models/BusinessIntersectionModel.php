<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BusinessIntersectionModel extends Model
{
    use HasFactory;

    protected $table = 'business_intersections';

    protected $fillable = [
        'name',
    ];

    /**
     * Relationship: Business intersection has many businesses
     *
     * @return \Illuminate\Database\Eloquent\Relations\HasMany
     */
    public function businesses()
    {
        return $this->hasMany(BusinessModel::class, 'business_intersection_id', 'id');
    }
}
