<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class CmsPageModel extends Model
{
    use HasFactory;

    // Define table name for this model
    protected $table = 'cms_pages';

    // Define primary key column name
    protected $primaryKey = 'cms_page_id';

    // Define fillable fields that can be mass-assigned
    protected $fillable = [
        'title', // CMS page title (e.g., "Terms & Conditions", "Privacy Policy")
        'slug', // URL-friendly identifier (e.g., "terms-and-conditions", "privacy-policy")
        'content', // Rich text content from WYSIWYG editor (HTML format)
        'is_active', // Status flag to enable/disable page visibility
    ];

    // Define casts for data type conversion
    protected $casts = [
        'is_active' => 'boolean', // Cast is_active to boolean
    ];

    // Define hidden fields that should not be included in JSON responses
    protected $hidden = [
        // No hidden fields for CMS page model
    ];

    /**
     * Generate URL-friendly slug from title
     *
     * @param  string  $title  The title to convert to slug
     * @param  int|null  $excludeId  CMS page ID to exclude from uniqueness check (for updates)
     * @return string Generated unique slug
     */
    public function generateSlug($title, $excludeId = null)
    {
        // Convert title to lowercase
        $baseSlug = Str::lower($title);

        // Replace spaces with hyphens
        $baseSlug = str_replace(' ', '-', $baseSlug);

        // Remove special characters, keep only alphanumeric and hyphens
        $baseSlug = preg_replace('/[^a-z0-9\-]/', '', $baseSlug);

        // Remove multiple consecutive hyphens
        $baseSlug = preg_replace('/-+/', '-', $baseSlug);

        // Trim hyphens from start and end
        $baseSlug = trim($baseSlug, '-');

        // Ensure slug is not empty (fallback to 'page' if empty)
        if (empty($baseSlug)) {
            $baseSlug = 'page';
        }

        // Check if slug already exists in database
        $query = CmsPageModel::where('slug', $baseSlug);

        // Exclude current page ID if provided (for updates)
        if (! empty($excludeId)) {
            $query->where('cms_page_id', '!=', $excludeId);
        }

        // If slug exists, append number to make it unique
        if ($query->exists()) {
            $counter = 2;
            $uniqueSlug = $baseSlug.'-'.$counter;

            // Keep incrementing until we find a unique slug
            while (CmsPageModel::where('slug', $uniqueSlug)
                ->when($excludeId, function ($q) use ($excludeId) {
                    return $q->where('cms_page_id', '!=', $excludeId);
                })
                ->exists()) {
                $counter++;
                $uniqueSlug = $baseSlug.'-'.$counter;
            }

            return $uniqueSlug;
        }

        // Return the unique slug
        return $baseSlug;
    }

    /**
     * Get single CMS page record by query conditions
     *
     * @param  array  $queryCondition  Associative array of conditions (e.g., ['cms_page_id' => 1])
     * @return object|null CMS page record or null if not found
     */
    public function get_cms_page($queryCondition)
    {
        // Query database using Eloquent where clause with provided conditions
        $result = CmsPageModel::where($queryCondition)->first();

        return $result;
    }

    /**
     * Get multiple CMS page records by query conditions
     *
     * @param  array  $queryCondition  Associative array of conditions
     * @return \Illuminate\Database\Eloquent\Collection Collection of CMS page records
     */
    public function get_cms_pages_list($queryCondition)
    {
        // Query database to get collection of records matching conditions
        $result = CmsPageModel::where($queryCondition)->get();

        return $result;
    }

    /**
     * Create new CMS page record
     *
     * @param  array  $data  Associative array of data to insert
     * @return \Illuminate\Database\Eloquent\Model Created CMS page record
     */
    public function create_cms_page($data)
    {
        // Create new record using Eloquent create method
        $result = CmsPageModel::create($data);

        return $result;
    }

    /**
     * Update CMS page record by query conditions
     *
     * @param  array  $queryCondition  Associative array of conditions to find record(s)
     * @param  array  $editData  Associative array of data to update
     * @return int Number of affected rows
     */
    public function update_cms_page($queryCondition, $editData)
    {
        // Update records matching query conditions
        $result = CmsPageModel::where($queryCondition)->update($editData);

        return $result;
    }

    /**
     * Delete CMS page record by query conditions
     *
     * @param  array  $queryCondition  Associative array of conditions to find record(s)
     * @return int Number of affected rows
     */
    public function delete_cms_page($queryCondition)
    {
        // Delete records matching query conditions
        $result = CmsPageModel::where($queryCondition)->delete();

        return $result;
    }

    /**
     * Get all active CMS pages for footer display
     *
     * @return \Illuminate\Database\Eloquent\Collection Collection of active CMS pages
     */
    public function get_active_cms_pages()
    {
        // Query database to get all active CMS pages, sorted alphabetically by title
        $result = CmsPageModel::where('is_active', true)
            ->orderBy('title', 'asc')
            ->get();

        return $result;
    }

    /**
     * Get single active CMS page by slug
     *
     * @param  string  $slug  URL-friendly slug identifier
     * @return object|null Active CMS page record or null if not found
     */
    public function get_active_cms_page_by_slug($slug)
    {
        // Query database to get active CMS page by slug
        $result = CmsPageModel::where('slug', $slug)
            ->where('is_active', true)
            ->first();

        return $result;
    }

    /**
     * Check if CMS page record exists by query conditions
     *
     * @param  array  $queryCondition  Associative array of conditions
     * @return bool True if record exists, false otherwise
     */
    public function check_cms_page_exists($queryCondition)
    {
        // Check if any record exists matching the conditions
        $result = CmsPageModel::where($queryCondition)->exists();

        return $result;
    }
}
