<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class UserFeedbackModel extends Model
{
    use HasFactory;

    protected $table = 'user_feedbacks';

    protected $primaryKey = 'feedback_id';

    protected $fillable = [
        'submitter_type',
        'user_id',
        'host_user_id',
        'title',
        'description',
    ];

    /**
     * Submitter when feedback is from an End User.
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function user()
    {
        return $this->belongsTo(UserModel::class, 'user_id', 'user_id');
    }

    /**
     * Submitter when feedback is from a Host.
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function hostUser()
    {
        return $this->belongsTo(HostUserModel::class, 'host_user_id', 'host_user_id');
    }
}
