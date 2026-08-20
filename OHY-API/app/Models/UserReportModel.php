<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class UserReportModel extends Model
{
    use HasFactory;

    protected $table = 'user_reports';

    protected $primaryKey = 'report_id';

    protected $fillable = [
        'user_id',
        'event_id',
        'host_user_id',
        'order_id',
        'title',
        'description',
        'priority',
        'status',
    ];

    /**
     * Reporter (End User who submitted the report).
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function user()
    {
        return $this->belongsTo(UserModel::class, 'user_id', 'user_id');
    }

    /**
     * Reported event (when report is for an event).
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function event()
    {
        return $this->belongsTo(EventModel::class, 'event_id', 'event_id');
    }

    /**
     * Reported host user / business profile (when report is for a host).
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function hostUser()
    {
        return $this->belongsTo(HostUserModel::class, 'host_user_id', 'host_user_id');
    }

    /**
     * Reported order (when report is for an order).
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function order()
    {
        return $this->belongsTo(OrderModel::class, 'order_id', 'order_id');
    }
}
