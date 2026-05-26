import { Request, Response } from 'express';
import releaseService, { ReleaseServiceError } from '../services/releaseService.js';

export const getPendingReleases = async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string, 10) || 20;
    const offset = parseInt(req.query.offset as string, 10) || 0;
    const search = req.query.search as string;

    const { rows, count } = await releaseService.getAllReleases({
      status: 'pending_review',
      limit,
      offset,
      search,
    });

    res.status(200).json({
      success: true,
      data: rows,
      meta: {
        total: count,
        limit,
        offset,
      },
    });
  } catch (error) {
    console.error('Get Pending Releases Error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch pending releases' });
  }
};

export const getAllReleases = async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string, 10) || 20;
    const offset = parseInt(req.query.offset as string, 10) || 0;
    const search = req.query.search as string;
    const status = req.query.status as string;

    const { rows, count } = await releaseService.getAllReleases({
      status,
      limit,
      offset,
      search,
    });

    res.status(200).json({
      success: true,
      data: rows,
      meta: {
        total: count,
        limit,
        offset,
      },
    });
  } catch (error) {
    console.error('Get All Releases Error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch releases' });
  }
};

export const approveRelease = async (req: Request, res: Response) => {
  try {
    const releaseId = parseInt(req.params.id, 10);
    if (isNaN(releaseId)) {
      return res.status(400).json({ success: false, message: 'Invalid release ID' });
    }

    const release = await releaseService.updateReleaseStatus(releaseId, 'approved');
    res.status(200).json({ success: true, message: 'Release approved', release });
  } catch (error) {
    if (error instanceof ReleaseServiceError) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    console.error('Approve Release Error:', error);
    res.status(500).json({ success: false, message: 'Failed to approve release' });
  }
};

export const rejectRelease = async (req: Request, res: Response) => {
  try {
    const releaseId = parseInt(req.params.id, 10);
    if (isNaN(releaseId)) {
      return res.status(400).json({ success: false, message: 'Invalid release ID' });
    }

    const { reason } = req.body;
    if (!reason) {
      return res.status(400).json({ success: false, message: 'Rejection reason is required' });
    }

    const release = await releaseService.updateReleaseStatus(releaseId, 'rejected', reason);
    res.status(200).json({ success: true, message: 'Release rejected', release });
  } catch (error) {
    if (error instanceof ReleaseServiceError) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    console.error('Reject Release Error:', error);
    res.status(500).json({ success: false, message: 'Failed to reject release' });
  }
};

export const markReleaseLive = async (req: Request, res: Response) => {
  try {
    const releaseId = parseInt(req.params.id, 10);
    if (isNaN(releaseId)) {
      return res.status(400).json({ success: false, message: 'Invalid release ID' });
    }

    const release = await releaseService.updateReleaseStatus(releaseId, 'live');
    res.status(200).json({ success: true, message: 'Release marked as live', release });
  } catch (error) {
    if (error instanceof ReleaseServiceError) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    console.error('Mark Live Release Error:', error);
    res.status(500).json({ success: false, message: 'Failed to mark release live' });
  }
};

export const takeDownRelease = async (req: Request, res: Response) => {
  try {
    const releaseId = parseInt(req.params.id, 10);
    if (isNaN(releaseId)) {
      return res.status(400).json({ success: false, message: 'Invalid release ID' });
    }

    const { reason } = req.body;
    
    const release = await releaseService.updateReleaseStatus(releaseId, 'taken_down', reason);
    res.status(200).json({ success: true, message: 'Release taken down', release });
  } catch (error) {
    if (error instanceof ReleaseServiceError) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    console.error('Take Down Release Error:', error);
    res.status(500).json({ success: false, message: 'Failed to take down release' });
  }
};
