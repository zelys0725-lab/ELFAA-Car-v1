<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Document;
use App\Models\DocumentAuditLog;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

class DocumentVerificationFeatureTest extends TestCase
{
    use RefreshDatabase;

    protected User $client;
    protected User $otherClient;
    protected User $admin;

    protected function setUp(): void
    {
        parent::setUp();

        Storage::fake('local');

        $this->client = User::factory()->create([
            'role' => 'client',
            'name' => 'John Renter',
            'drivers_license_number' => 'N01-20-112233',
        ]);

        $this->otherClient = User::factory()->create([
            'role' => 'client',
            'name' => 'Jane Other',
        ]);

        $this->admin = User::factory()->create([
            'role' => 'admin',
            'name' => 'Admin Operator',
        ]);
    }

    public function test_client_can_upload_document_securely(): void
    {
        $file = UploadedFile::fake()->image('drivers_license.jpg', 600, 400);

        $response = $this->actingAs($this->client)
            ->post(route('client.documents.store'), [
                'type' => 'gov_id_1',
                'file' => $file,
            ]);

        $response->assertRedirect(route('client.dashboard'));

        $this->assertDatabaseHas('documents', [
            'user_id' => $this->client->id,
            'type' => 'gov_id_1',
            'status' => 'pending',
            'storage_disk' => 'local',
        ]);

        $document = Document::where('user_id', $this->client->id)->first();
        $this->assertNotNull($document);
        $this->assertEquals('local', $document->storage_disk);

        // Verify audit log exists
        $this->assertDatabaseHas('document_audit_logs', [
            'document_id' => $document->id,
            'action' => 'uploaded',
        ]);
    }

    public function test_unauthorized_user_cannot_view_another_clients_document(): void
    {
        Storage::disk('local')->put('documents/test.jpg', 'fake-image-content');

        $document = Document::create([
            'user_id' => $this->client->id,
            'type' => 'gov_id_1',
            'file_path' => 'documents/test.jpg',
            'storage_disk' => 'local',
            'status' => 'pending',
        ]);

        $response = $this->actingAs($this->otherClient)
            ->get(route('documents.file', $document->id));

        $response->assertStatus(403);
    }

    public function test_owner_can_view_own_document(): void
    {
        Storage::disk('local')->put('documents/test.jpg', 'fake-image-content');

        $document = Document::create([
            'user_id' => $this->client->id,
            'type' => 'gov_id_1',
            'file_path' => 'documents/test.jpg',
            'storage_disk' => 'local',
            'mime_type' => 'image/jpeg',
            'status' => 'pending',
        ]);

        $response = $this->actingAs($this->client)
            ->get(route('documents.file', $document->id));

        $response->assertStatus(200);
    }

    public function test_admin_can_view_any_document(): void
    {
        Storage::disk('local')->put('documents/test.jpg', 'fake-image-content');

        $document = Document::create([
            'user_id' => $this->client->id,
            'type' => 'gov_id_1',
            'file_path' => 'documents/test.jpg',
            'storage_disk' => 'local',
            'mime_type' => 'image/jpeg',
            'status' => 'pending',
        ]);

        $response = $this->actingAs($this->admin)
            ->get(route('documents.file', $document->id));

        $response->assertStatus(200);
    }

    public function test_admin_can_approve_document_and_log_audit(): void
    {
        $document = Document::create([
            'user_id' => $this->client->id,
            'type' => 'gov_id_1',
            'file_path' => 'documents/test.jpg',
            'storage_disk' => 'local',
            'status' => 'pending',
        ]);

        $response = $this->actingAs($this->admin)
            ->post(route('admin.documents.decision', $document->id), [
                'action' => 'approve',
                'notes' => 'License confirmed and matched in system.',
            ]);

        $response->assertRedirect();

        $document->refresh();
        $this->assertEquals('verified', $document->status);
        $this->assertEquals($this->admin->id, $document->verified_by);
        $this->assertNotNull($document->verified_at);

        $this->assertDatabaseHas('document_audit_logs', [
            'document_id' => $document->id,
            'user_id' => $this->admin->id,
            'action' => 'approved',
            'new_status' => 'verified',
        ]);
    }

    public function test_admin_can_reject_document_with_reason(): void
    {
        $document = Document::create([
            'user_id' => $this->client->id,
            'type' => 'gov_id_1',
            'file_path' => 'documents/test.jpg',
            'storage_disk' => 'local',
            'status' => 'pending',
        ]);

        $response = $this->actingAs($this->admin)
            ->post(route('admin.documents.decision', $document->id), [
                'action' => 'reject',
                'reject_reason' => 'Driver license is expired as of 2024.',
            ]);

        $response->assertRedirect();

        $document->refresh();
        $this->assertEquals('rejected', $document->status);
        $this->assertEquals('Driver license is expired as of 2024.', $document->reject_reason);

        $this->assertDatabaseHas('document_audit_logs', [
            'document_id' => $document->id,
            'user_id' => $this->admin->id,
            'action' => 'rejected',
            'new_status' => 'rejected',
        ]);
    }

    public function test_admin_can_request_resubmission(): void
    {
        $document = Document::create([
            'user_id' => $this->client->id,
            'type' => 'gov_id_1',
            'file_path' => 'documents/test.jpg',
            'storage_disk' => 'local',
            'status' => 'pending',
        ]);

        $response = $this->actingAs($this->admin)
            ->post(route('admin.documents.decision', $document->id), [
                'action' => 'request_resubmission',
                'resubmission_notes' => 'Please upload both front and back sides of your license.',
            ]);

        $response->assertRedirect();

        $document->refresh();
        $this->assertEquals('resubmission_requested', $document->status);
        $this->assertEquals('Please upload both front and back sides of your license.', $document->resubmission_notes);

        $this->assertDatabaseHas('document_audit_logs', [
            'document_id' => $document->id,
            'user_id' => $this->admin->id,
            'action' => 'resubmission_requested',
            'new_status' => 'resubmission_requested',
        ]);
    }

    public function test_client_cannot_make_verification_decisions(): void
    {
        $document = Document::create([
            'user_id' => $this->client->id,
            'type' => 'gov_id_1',
            'file_path' => 'documents/test.jpg',
            'storage_disk' => 'local',
            'status' => 'pending',
        ]);

        $response = $this->actingAs($this->client)
            ->post(route('admin.documents.decision', $document->id), [
                'action' => 'approve',
            ]);

        $response->assertStatus(403);
    }
}
