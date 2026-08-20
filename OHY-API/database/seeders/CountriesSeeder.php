<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class CountriesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     * 
     * Imports countries data from the provided SQL file.
     * This seeder reads the INSERT statements from countries.sql
     * and executes them to populate the countries table.
     */
    public function run(): void
    {
        // Read the countries SQL file content
        // Try project path first, then fallback to user's Downloads folder
        $sqlFile = base_path('database/seeders/countries.sql');
        
        if (!file_exists($sqlFile)) {
            // Alternative path: user's Downloads folder
            $sqlFile = 'C:\Users\chrom\Downloads\countries.sql';
        }
        
        // Read SQL file content
        $sql = file_get_contents($sqlFile);
        
        // Extract the INSERT statement using regex
        // Match INSERT INTO `countries` ... VALUES ... (multiline)
        preg_match('/INSERT INTO `countries`[^;]+;/s', $sql, $matches);
        
        if (!empty($matches[0])) {
            // Execute the INSERT statement directly
            // Use DB::unprepared() to execute raw SQL
            DB::unprepared($matches[0]);
        } else {
            // Fallback: Parse and insert manually if regex fails
            // This handles cases where SQL format might be different
            $lines = explode("\n", $sql);
            $insertStarted = false;
            $batchData = [];
            
            foreach ($lines as $line) {
                $line = trim($line);
                
                // Check if this is the INSERT statement start
                if (strpos($line, 'INSERT INTO `countries`') !== false) {
                    $insertStarted = true;
                }
                
                if ($insertStarted && !empty($line)) {
                    // Extract value tuples from the line
                    // Pattern: (1, 'AF', 'AFGHANISTAN', ...)
                    preg_match_all('/\(([^)]+)\)/', $line, $valueMatches);
                    
                    foreach ($valueMatches[1] as $valueString) {
                        // Parse comma-separated values, handling NULL and strings
                        $values = [];
                        $currentValue = '';
                        $inQuotes = false;
                        $quoteChar = '';
                        
                        for ($i = 0; $i < strlen($valueString); $i++) {
                            $char = $valueString[$i];
                            
                            if (($char === '"' || $char === "'") && ($i === 0 || $valueString[$i - 1] !== '\\')) {
                                if (!$inQuotes) {
                                    $inQuotes = true;
                                    $quoteChar = $char;
                                } elseif ($char === $quoteChar) {
                                    $inQuotes = false;
                                    $quoteChar = '';
                                }
                                $currentValue .= $char;
                            } elseif ($char === ',' && !$inQuotes) {
                                $values[] = trim($currentValue);
                                $currentValue = '';
                            } else {
                                $currentValue .= $char;
                            }
                        }
                        
                        if (!empty($currentValue)) {
                            $values[] = trim($currentValue);
                        }
                        
                        // Insert into countries table if we have enough values
                        if (count($values) >= 9) {
                            // Parse values: country_id, iso, name, nicename, flag_icon, iso3, numcode, phonecode, is_deleted
                            $batchData[] = [
                                'iso' => trim($values[1], "'\""),
                                'name' => trim($values[2], "'\""),
                                'nicename' => trim($values[3], "'\""),
                                'flag_icon' => ($values[4] === 'NULL' || empty($values[4])) ? null : trim($values[4], "'\""),
                                'iso3' => ($values[5] === 'NULL' || empty($values[5])) ? null : trim($values[5], "'\""),
                                'numcode' => ($values[6] === 'NULL' || empty($values[6])) ? null : (int)$values[6],
                                'phonecode' => (int)$values[7],
                                'is_deleted' => isset($values[8]) ? (int)$values[8] : 0,
                                'created_at' => now(),
                                'updated_at' => now(),
                            ];
                        }
                    }
                    
                    // Check if this is the end of INSERT (COMMIT statement or end of file)
                    if (strpos($line, 'COMMIT') !== false || strpos($line, ';') !== false && count($batchData) > 0) {
                        // Insert batch of countries
                        if (!empty($batchData)) {
                            DB::table('countries')->insert($batchData);
                            $batchData = [];
                        }
                        break;
                    }
                }
            }
            
            // Insert any remaining batch data
            if (!empty($batchData)) {
                DB::table('countries')->insert($batchData);
            }
        }
    }
}

