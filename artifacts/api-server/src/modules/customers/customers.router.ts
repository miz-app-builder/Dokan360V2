import { Router, type IRouter } from "express";
import {
  CreateCustomerBody,
  UpdateCustomerBody,
  CollectPaymentBody,
  ListCustomersQueryParams,
  GetCustomerParams,
  UpdateCustomerParams,
  GetCustomerLedgerParams,
  DeleteCustomerParams,
  CollectPaymentParams,
} from "@workspace/api-zod";
import { requireAuth, getShopId } from "../../middleware/auth.middleware";
import * as customersService from "./customers.service";

const router: IRouter = Router();

router.get("/customers", requireAuth, async (req, res, next): Promise<void> => {
  try {
    const params = ListCustomersQueryParams.safeParse(req.query);
    if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
    res.json(await customersService.listCustomers(getShopId(req), params.data.search));
  } catch (err) { next(err); }
});

router.post("/customers", requireAuth, async (req, res, next): Promise<void> => {
  try {
    const parsed = CreateCustomerBody.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
    res.status(201).json(await customersService.createCustomer(getShopId(req), parsed.data));
  } catch (err) { next(err); }
});

router.get("/customers/:id", requireAuth, async (req, res, next): Promise<void> => {
  try {
    const params = GetCustomerParams.safeParse(req.params);
    if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
    res.json(await customersService.getCustomer(getShopId(req), params.data.id));
  } catch (err) { next(err); }
});

router.patch("/customers/:id", requireAuth, async (req, res, next): Promise<void> => {
  try {
    const params = UpdateCustomerParams.safeParse(req.params);
    if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
    const parsed = UpdateCustomerBody.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
    res.json(await customersService.updateCustomer(getShopId(req), params.data.id, parsed.data));
  } catch (err) { next(err); }
});

router.delete("/customers/:id", requireAuth, async (req, res, next): Promise<void> => {
  try {
    const params = DeleteCustomerParams.safeParse(req.params);
    if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
    await customersService.deleteCustomer(getShopId(req), params.data.id);
    res.status(204).send();
  } catch (err) { next(err); }
});

router.post("/customers/:id/payment", requireAuth, async (req, res, next): Promise<void> => {
  try {
    const params = CollectPaymentParams.safeParse(req.params);
    if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
    const parsed = CollectPaymentBody.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
    res.json(await customersService.collectPayment(
      getShopId(req),
      params.data.id,
      parsed.data.amount,
      parsed.data.note ?? undefined,
    ));
  } catch (err) { next(err); }
});

router.get("/customers/:id/ledger", requireAuth, async (req, res, next): Promise<void> => {
  try {
    const params = GetCustomerLedgerParams.safeParse(req.params);
    if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
    res.json(await customersService.getCustomerLedger(params.data.id));
  } catch (err) { next(err); }
});

export default router;
