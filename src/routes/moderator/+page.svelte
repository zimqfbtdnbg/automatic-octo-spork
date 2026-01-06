<script lang="ts">
  import { onMount } from 'svelte';
  let users: any[] = [];
  let videos: any[] = [];
  let loading = true;

  async function loadData() {
    loading = true;
    const [uRes, vRes] = await Promise.all([
      fetch('/api/moderator/users'),
      fetch('/api/moderator/videos')
    ]);

    if (uRes.ok) users = await uRes.json().then(r => r.users || []);
    else users = [];

    if (vRes.ok) videos = await vRes.json().then(r => r.videos || []);
    else videos = [];

    loading = false;
  }

  onMount(() => {
    loadData();
  });

  async function toggleScam(user) {
    const newVal = user.is_scam ? 0 : 1;
    const res = await fetch('/api/moderator/users', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: user.id, is_scam: newVal })
    });
    if (res.ok) {
      user.is_scam = newVal;
    } else alert('Failed to update');
  }

  async function deleteUser(user) {
    if (!confirm(`Delete user ${user.username}?`)) return;
    const res = await fetch('/api/moderator/users', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: user.id })
    });
    if (res.ok) {
      users = users.filter(u => u.id !== user.id);
    } else alert('Failed to delete');
  }

  async function toggle18(video) {
    const newVal = video.is_18 ? 0 : 1;
    const res = await fetch('/api/moderator/videos', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: video.id, is_18: newVal })
    });
    if (res.ok) {
      video.is_18 = newVal;
    } else alert('Failed to update');
  }

  async function deleteVideo(video) {
    if (!confirm(`Delete video ${video.title}?`)) return;
    const res = await fetch('/api/moderator/videos', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: video.id })
    });
    if (res.ok) {
      videos = videos.filter(v => v.id !== video.id);
    } else alert('Failed to delete');
  }
</script>

<style>
  .panel { padding: 16px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
  th, td { padding: 8px; border-bottom: 1px solid #ddd; text-align: left; }
  .danger { color: #c0392b; }
  .flag { background: #f1c40f; padding: 2px 6px; border-radius: 4px; }
</style>

<div class="panel">
  <h1>Moderator Panel</h1>
  {#if loading}
    <p>Loading...</p>
  {:else}
    <section>
      <h2>Users</h2>
      <table>
        <thead>
          <tr><th>ID</th><th>Username</th><th>Email</th><th>Role</th><th>Scam</th><th>Actions</th></tr>
        </thead>
        <tbody>
          {#each users as user}
            <tr>
              <td>{user.id}</td>
              <td>{user.username}</td>
              <td>{user.email}</td>
              <td>{user.role}</td>
              <td>{user.is_scam ? <span class="flag">SCAM</span> : ''}</td>
              <td>
                <button on:click={() => toggleScam(user)}>{user.is_scam ? 'Unflag' : 'Flag as scam'}</button>
                <button class="danger" on:click={() => deleteUser(user)}>Delete</button>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </section>

    <section>
      <h2>Videos</h2>
      <table>
        <thead>
          <tr><th>ID</th><th>Title</th><th>Channel</th><th>Views</th><th>18+</th><th>Actions</th></tr>
        </thead>
        <tbody>
          {#each videos as video}
            <tr>
              <td>{video.id}</td>
              <td>{video.title}</td>
              <td>{video.user_id}</td>
              <td>{video.views}</td>
              <td>{video.is_18 ? 'Yes' : 'No'}</td>
              <td>
                <button on:click={() => toggle18(video)}>{video.is_18 ? 'Unset 18+' : 'Set 18+'}</button>
                <button class="danger" on:click={() => deleteVideo(video)}>Delete</button>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </section>
  {/if}
</div>
