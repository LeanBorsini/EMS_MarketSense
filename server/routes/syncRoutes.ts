import { Router, Request, Response } from 'express';
import { serverStore } from '../store';
import { SyncRoom } from '../types';

export const syncRouter = Router();

function generateSyncCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 5; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

syncRouter.post('/create-room', (req: Request, res: Response) => {
  try {
    const { state, hostDevice = 'desktop' } = req.body || {};
    let code = generateSyncCode();
    while (serverStore.hasRoom(code)) {
      code = generateSyncCode();
    }

    const room: SyncRoom = {
      code,
      state: state || {},
      createdAt: Date.now(),
      lastUpdated: Date.now(),
      devices: 1,
      hostDevice,
    };

    serverStore.setRoom(code, room);
    console.log(`[SYNC RELAY] Sala creada #${code} desde ${hostDevice}`);

    return res.status(200).json({
      success: true,
      code,
      expiresIn: '48h',
      message: `Código de sincronización de 5 dígitos generado: ${code}`,
    });
  } catch (err) {
    console.error('Error creating sync room:', err);
    return res.status(500).json({ error: 'Error al generar código de sincronización' });
  }
});

syncRouter.post('/update-room', (req: Request, res: Response) => {
  try {
    const { code, state, device = 'desktop' } = req.body || {};
    if (!code) {
      return res.status(400).json({ error: 'Código de sincronización requerido' });
    }

    const room = serverStore.getRoom(code);
    if (!room) {
      return res.status(404).json({ error: 'Código inválido o sesión expirada' });
    }

    room.state = state;
    room.lastUpdated = Date.now();
    if (device === 'mobile' && !room.guestDevice) {
      room.guestDevice = 'mobile';
      room.devices = 2;
    }

    serverStore.setRoom(code, room);
    return res.status(200).json({ success: true, updated: room.lastUpdated });
  } catch (err) {
    console.error('Error updating sync room:', err);
    return res.status(500).json({ error: 'Error al actualizar sesión sincronizada' });
  }
});

syncRouter.get('/join-room/:code', (req: Request, res: Response) => {
  try {
    const { code } = req.params;
    if (!code) {
      return res.status(400).json({ error: 'Código requerido' });
    }

    const room = serverStore.getRoom(code);
    if (!room) {
      return res.status(404).json({ 
        error: 'Código no encontrado o sesión expirada. Verifica los 5 caracteres en la otra pantalla.' 
      });
    }

    room.devices = Math.max(room.devices, 2);
    room.guestDevice = room.guestDevice || 'mobile';
    serverStore.setRoom(code, room);

    return res.status(200).json({
      success: true,
      code: room.code,
      state: room.state,
      devices: room.devices,
      lastUpdated: room.lastUpdated,
      message: '¡Sesión emparejada y sincronizada exitosamente!',
    });
  } catch (err) {
    console.error('Error retrieving sync room:', err);
    return res.status(500).json({ error: 'Error al consultar código de sincronización' });
  }
});

syncRouter.get('/room/:code/status', (req: Request, res: Response) => {
  const { code } = req.params;
  const room = serverStore.getRoom(code);

  if (!room) {
    return res.status(404).json({ exists: false, code: (code || '').trim().toUpperCase() });
  }

  return res.status(200).json({
    exists: true,
    code: room.code,
    devices: room.devices,
    lastUpdated: room.lastUpdated,
    hostDevice: room.hostDevice,
    guestDevice: room.guestDevice,
  });
});
