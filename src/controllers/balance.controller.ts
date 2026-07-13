import type { NextFunction, Request, Response } from 'express';
import { balanceService } from '../services/balance.service';
import type { BalancePeriodo } from '../types/balance';

const PERIODOS: BalancePeriodo[] = ['7d', '30d', '90d', 'all'];

export const balanceController = {
  resumen(req: Request, res: Response, next: NextFunction): void {
    try {
      const raw = (req.query.periodo as string) ?? 'all';
      const periodo: BalancePeriodo = PERIODOS.includes(raw as BalancePeriodo)
        ? (raw as BalancePeriodo)
        : 'all';
      res.json({ data: balanceService.getResumen(req.user!, periodo) });
    } catch (err) {
      next(err);
    }
  },
};
