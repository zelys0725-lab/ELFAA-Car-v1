<?php

namespace App\Services;

class TotpService
{
    /**
     * RFC 4648 Base32 alphabet.
     */
    private const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

    /**
     * Generate a cryptographically secure Base32 TOTP secret.
     * Default length 16 chars (80 bits) or 32 chars (160 bits).
     */
    public function generateSecret(int $length = 16): string
    {
        $alphabet = self::BASE32_ALPHABET;
        $alphabetLen = strlen($alphabet);
        $secret = '';

        for ($i = 0; $i < $length; $i++) {
            $secret .= $alphabet[random_int(0, $alphabetLen - 1)];
        }

        return $secret;
    }

    /**
     * Build the standard otpauth URI for QR codes.
     */
    public function getOtpAuthUrl(string $issuer, string $accountName, string $secret): string
    {
        $cleanIssuer = rawurlencode($issuer);
        $cleanAccount = rawurlencode($accountName);
        $cleanSecret = rawurlencode(str_replace(' ', '', strtoupper($secret)));

        return "otpauth://totp/{$cleanIssuer}:{$cleanAccount}?secret={$cleanSecret}&issuer={$cleanIssuer}&algorithm=SHA1&digits=6&period=30";
    }

    /**
     * Calculate 6-digit TOTP code for a given timestamp.
     */
    public function calculateCode(string $secret, ?int $timestamp = null, int $digits = 6, int $period = 30): string
    {
        $timestamp = $timestamp ?? time();
        $timeCounter = (int) floor($timestamp / $period);

        // Pack 64-bit integer into big-endian binary string
        $binaryCounter = pack('N*', 0) . pack('N*', $timeCounter);

        $binarySecret = $this->base32Decode($secret);
        $hash = hash_hmac('sha1', $binaryCounter, $binarySecret, true);

        // Dynamic truncation (RFC 4226 section 5.4)
        $offset = ord($hash[19]) & 0x0f;
        $binaryCode = (
            ((ord($hash[$offset]) & 0x7f) << 24) |
            ((ord($hash[$offset + 1]) & 0xff) << 16) |
            ((ord($hash[$offset + 2]) & 0xff) << 8) |
            (ord($hash[$offset + 3]) & 0xff)
        );

        $otp = $binaryCode % (10 ** $digits);

        return str_pad((string) $otp, $digits, '0', STR_PAD_LEFT);
    }

    /**
     * Verify a 6-digit TOTP code with time drift window.
     *
     * @param string $secret Base32 secret
     * @param string $code User-submitted code
     * @param int $window Tolerance steps before and after current timestamp (1 = ±30s)
     * @param int $period Time step in seconds (default 30)
     */
    public function verify(string $secret, string $code, int $window = 1, int $period = 30): bool
    {
        $cleanCode = preg_replace('/\s+/', '', (string) $code);
        if (strlen($cleanCode) !== 6 || !ctype_digit($cleanCode)) {
            return false;
        }

        $now = time();
        for ($i = -$window; $i <= $window; $i++) {
            $expectedCode = $this->calculateCode($secret, $now + ($i * $period), 6, $period);
            if (hash_equals($expectedCode, $cleanCode)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Decode a Base32 string into raw binary bytes.
     */
    public function base32Decode(string $secret): string
    {
        $secret = strtoupper(preg_replace('/[^A-Z2-7]/', '', $secret));
        if (empty($secret)) {
            return '';
        }

        $buffer = 0;
        $bitsLeft = 0;
        $binary = '';

        for ($i = 0, $len = strlen($secret); $i < $len; $i++) {
            $val = strpos(self::BASE32_ALPHABET, $secret[$i]);
            if ($val === false) {
                continue;
            }

            $buffer = ($buffer << 5) | $val;
            $bitsLeft += 5;

            if ($bitsLeft >= 8) {
                $bitsLeft -= 8;
                $binary .= chr(($buffer >> $bitsLeft) & 0xff);
            }
        }

        return $binary;
    }

    /**
     * Encode binary data into Base32.
     */
    public function base32Encode(string $data): string
    {
        if (empty($data)) {
            return '';
        }

        $buffer = 0;
        $bitsLeft = 0;
        $base32 = '';

        for ($i = 0, $len = strlen($data); $i < $len; $i++) {
            $buffer = ($buffer << 8) | ord($data[$i]);
            $bitsLeft += 8;

            while ($bitsLeft >= 5) {
                $bitsLeft -= 5;
                $base32 .= self::BASE32_ALPHABET[($buffer >> $bitsLeft) & 0x1f];
            }
        }

        if ($bitsLeft > 0) {
            $base32 .= self::BASE32_ALPHABET[($buffer << (5 - $bitsLeft)) & 0x1f];
        }

        return $base32;
    }
}
