import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { Tag, Plus, Percent, DollarSign, Edit2, Trash2, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { getEventDataForEditing } from "@/api/services/eventService";
import { formatDateForAPI, parseDateFromAPIToString } from "@/utils/dateUtils";
import { toast } from "sonner";
import { DatePicker } from "@/components/ui/date-picker";

type CouponDiscountType = "percentage" | "flat";

interface CouponsStepProps {
  eventId?: number;
  onDataLoaded?: () => void;
}

interface LocalCoupon {
  tempId: string;
  coupon_code: string;
  discount_type: CouponDiscountType;
  discount_percent: number | null;
  flat_discount_amount: number | null;
  max_cap_discount: number | null;
  max_times_applicable: number;
  start_date: string;
  end_date: string | null;
  times_used?: number;
}

export interface CouponsStepRef {
  getCoupons: () => LocalCoupon[];
  refreshData: () => Promise<void>;
}

const CouponsStep = forwardRef<CouponsStepRef, CouponsStepProps>(({ eventId, onDataLoaded }, ref) => {
  const [coupons, setCoupons] = useState<LocalCoupon[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const formSectionRef = useRef<HTMLDivElement | null>(null);
  const hasLoadedDataRef = useRef(false);
  const lastEventIdRef = useRef<number | undefined>(undefined);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const [formState, setFormState] = useState({
    coupon_code: "",
    discount_type: "percentage" as CouponDiscountType,
    discount_percent: "",
    flat_discount_amount: "",
    max_cap_discount: "",
    max_times_applicable: "",
    start_date: "",
    end_date: "",
  });

  const resetForm = () => {
    setFormState({
      coupon_code: "",
      discount_type: "percentage",
      discount_percent: "",
      flat_discount_amount: "",
      max_cap_discount: "",
      max_times_applicable: "",
      start_date: "",
      end_date: "",
    });
    setFormErrors({});
    setEditingId(null);
  };

  const scrollToForm = () => {
    formSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const generateCouponCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "";
    for (let index = 0; index < 8; index += 1) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormState((prev) => ({ ...prev, coupon_code: code }));
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formState.coupon_code.trim()) {
      errors.coupon_code = "Coupon code is required";
    }
    if (formState.discount_type === "percentage") {
      if (!formState.discount_percent) {
        errors.discount_value = "Discount percent is required";
      } else {
        const percent = parseFloat(formState.discount_percent);
        if (Number.isNaN(percent) || percent <= 0 || percent > 100) {
          errors.discount_value = "Enter a valid percent between 0 and 100";
        }
      }
    } else {
      if (!formState.flat_discount_amount) {
        errors.discount_value = "Flat discount amount is required";
      } else {
        const amount = parseFloat(formState.flat_discount_amount);
        if (Number.isNaN(amount) || amount <= 0) {
          errors.discount_value = "Enter a valid flat discount amount";
        }
      }
    }
    if (!formState.max_times_applicable) {
      errors.max_times_applicable = "Max times applicable is required";
    } else {
      const maxTimes = parseInt(formState.max_times_applicable, 10);
      if (Number.isNaN(maxTimes) || maxTimes <= 0) {
        errors.max_times_applicable = "Enter a value greater than 0";
      }
    }
    if (!formState.start_date) {
      errors.start_date = "Start date is required";
    }
    if (formState.end_date && formState.start_date && formState.end_date < formState.start_date) {
      errors.end_date = "End date must be after start date";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveCoupon = () => {
    if (!validateForm()) {
      return;
    }
    const normalized: LocalCoupon = {
      tempId: editingId || `coupon_${Date.now()}`,
      coupon_code: formState.coupon_code.trim().toUpperCase(),
      discount_type: formState.discount_type,
      discount_percent:
        formState.discount_type === "percentage" ? parseFloat(formState.discount_percent) : null,
      flat_discount_amount:
        formState.discount_type === "flat" ? parseFloat(formState.flat_discount_amount) : null,
      max_cap_discount:
        formState.discount_type === "percentage" && formState.max_cap_discount
          ? parseFloat(formState.max_cap_discount)
          : null,
      max_times_applicable: parseInt(formState.max_times_applicable, 10),
      start_date: formState.start_date,
      end_date: formState.end_date ? formState.end_date : null,
    };

    const duplicate = coupons.find(
      (coupon) => coupon.coupon_code === normalized.coupon_code && coupon.tempId !== normalized.tempId,
    );
    if (duplicate) {
      toast.error("Coupon code must be unique");
      return;
    }

    if (editingId) {
      setCoupons((prev) => prev.map((coupon) => (coupon.tempId === editingId ? normalized : coupon)));
    } else {
      setCoupons((prev) => [...prev, normalized]);
    }
    resetForm();
    toast.success("Coupon saved locally");
  };

  const handleEditCoupon = (coupon: LocalCoupon) => {
    if (coupon.times_used && coupon.times_used > 0) {
      toast.error("Coupons already used cannot be edited");
      return;
    }
    setFormState({
      coupon_code: coupon.coupon_code,
      discount_type: coupon.discount_type,
      discount_percent: coupon.discount_percent ? coupon.discount_percent.toString() : "",
      flat_discount_amount: coupon.flat_discount_amount ? coupon.flat_discount_amount.toString() : "",
      max_cap_discount: coupon.max_cap_discount ? coupon.max_cap_discount.toString() : "",
      max_times_applicable: coupon.max_times_applicable.toString(),
      start_date: coupon.start_date,
      end_date: coupon.end_date ?? "",
    });
    setEditingId(coupon.tempId);
    setFormErrors({});
    scrollToForm();
  };

  const handleDeleteCoupon = (coupon: LocalCoupon) => {
    if (coupon.times_used && coupon.times_used > 0) {
      toast.error("Coupons already used cannot be deleted");
      return;
    }
    setCoupons((prev) => prev.filter((item) => item.tempId !== coupon.tempId));
  };

  const formatDisplayDate = (value: string | null) => {
    if (!value) {
      return "No end date";
    }
    const date = new Date(value);
    return date.toLocaleDateString();
  };

  const loadCoupons = async (force = false) => {
    if (!eventId) {
      hasLoadedDataRef.current = false;
      lastEventIdRef.current = undefined;
      return;
    }
    if (!force && hasLoadedDataRef.current && lastEventIdRef.current === eventId) {
      return;
    }
    try {
      setIsLoading(true);
      const response = await getEventDataForEditing(eventId);
      const couponsData = response.data.step_6?.coupons || [];
      const mapped: LocalCoupon[] = couponsData.map((coupon) => ({
        tempId: `coupon_${coupon.coupon_id}`,
        coupon_code: coupon.coupon_code,
        discount_type: coupon.discount_type,
        discount_percent: coupon.discount_percent ? parseFloat(coupon.discount_percent) : null,
        flat_discount_amount: coupon.flat_discount_amount ? parseFloat(coupon.flat_discount_amount) : null,
        max_cap_discount: coupon.max_cap_discount ? parseFloat(coupon.max_cap_discount) : null,
        max_times_applicable: coupon.max_times_applicable,
        start_date: parseDateFromAPIToString(coupon.start_date),
        end_date: coupon.end_date ? parseDateFromAPIToString(coupon.end_date) : null,
        times_used: coupon.times_used,
      }));
      setCoupons(mapped);
      if (mapped.length > 0) {
        onDataLoaded?.();
      }
      hasLoadedDataRef.current = true;
      lastEventIdRef.current = eventId;
    } catch (error) {
      console.error("Failed to load coupons:", error);
      hasLoadedDataRef.current = false;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCoupons();
  }, [eventId]);

  useImperativeHandle(ref, () => ({
    getCoupons: () => coupons,
    refreshData: async () => {
      if (!eventId) {
        return;
      }
      hasLoadedDataRef.current = false;
      await loadCoupons(true);
    },
  }));

  const startDateValue = formState.start_date ? new Date(formState.start_date) : undefined;
  const endDateValue = formState.end_date ? new Date(formState.end_date) : undefined;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            Discount Coupons
          </CardTitle>
          <CardDescription>Create discount codes to boost ticket sales</CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => {
              resetForm();
              scrollToForm();
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Discount Coupon
          </Button>
        </CardContent>
      </Card>

      <Card ref={formSectionRef}>
        <CardHeader>
          <CardTitle>{editingId ? "Edit Coupon" : "Create New Coupon"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div>
            <Label>Coupon Code*</Label>
            <div className="mt-2 flex gap-2">
              <Input
                placeholder="Enter Coupon Code"
                value={formState.coupon_code}
                onChange={(event) =>
                  setFormState((prev) => ({
                    ...prev,
                    coupon_code: event.target.value.toUpperCase(),
                  }))
                }
                className="font-mono"
              />
              <Button type="button" variant="outline" onClick={generateCouponCode}>
                Generate
              </Button>
            </div>
            {formErrors.coupon_code && (
              <p className="mt-1 text-sm text-red-500">{formErrors.coupon_code}</p>
            )}
          </div>

          <div>
            <Label>Discount Type*</Label>
            <RadioGroup
              value={formState.discount_type}
              onValueChange={(value: CouponDiscountType) => {
                setFormState((prev) => ({
                  ...prev,
                  discount_type: value,
                }));
                setFormErrors((prev) => ({ ...prev, discount_value: undefined }));
              }}
              className="mt-3 flex gap-6"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="percentage" id="percentage" />
                <Label htmlFor="percentage" className="flex items-center gap-1">
                  <Percent className="h-4 w-4" />
                  Percentage Discount
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="flat" id="flat" />
                <Label htmlFor="flat" className="flex items-center gap-1">
                  <DollarSign className="h-4 w-4" />
                  Flat Discount
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>
                {formState.discount_type === "percentage"
                  ? "Discount Percent*"
                  : "Flat Discount Amount*"}
              </Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                placeholder={
                  formState.discount_type === "percentage"
                    ? "Enter Discount Percent"
                    : "Enter Flat Discount Amount"
                }
                value={
                  formState.discount_type === "percentage"
                    ? formState.discount_percent
                    : formState.flat_discount_amount
                }
                onChange={(event) =>
                  setFormState((prev) => ({
                    ...prev,
                    [formState.discount_type === "percentage"
                      ? "discount_percent"
                      : "flat_discount_amount"]: event.target.value,
                  }))
                }
              />
              {formErrors.discount_value && (
                <p className="mt-1 text-sm text-red-500">{formErrors.discount_value}</p>
              )}
            </div>

            {formState.discount_type === "percentage" && (
              <div>
                <Label>Max Cap Discount</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Enter Max Cap Discount"
                  value={formState.max_cap_discount}
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      max_cap_discount: event.target.value,
                    }))
                  }
                />
              </div>
            )}

            <div>
              <Label>Max Times Applicable*</Label>
              <Input
                type="number"
                min="1"
                placeholder="Enter Max Times Applicable"
                value={formState.max_times_applicable}
                onChange={(event) =>
                  setFormState((prev) => ({
                    ...prev,
                    max_times_applicable: event.target.value,
                  }))
                }
              />
              {formErrors.max_times_applicable && (
                <p className="mt-1 text-sm text-red-500">{formErrors.max_times_applicable}</p>
              )}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>Start Date*</Label>
              <DatePicker
                date={startDateValue}
                onSelect={(selectedDate) => {
                  setFormState((prev) => ({
                    ...prev,
                    start_date: selectedDate ? formatDateForAPI(selectedDate) : "",
                  }));
                  if (selectedDate) {
                    setFormErrors((prev) => ({ ...prev, start_date: undefined }));
                  }
                }}
                placeholder="dd-mm-yyyy"
                error={Boolean(formErrors.start_date)}
              />
              {formErrors.start_date && (
                <p className="mt-1 text-sm text-red-500">{formErrors.start_date}</p>
              )}
            </div>
            <div>
              <Label>End Date</Label>
              <DatePicker
                date={endDateValue}
                onSelect={(selectedDate) => {
                  setFormState((prev) => ({
                    ...prev,
                    end_date: selectedDate ? formatDateForAPI(selectedDate) : "",
                  }));
                  if (selectedDate) {
                    setFormErrors((prev) => ({ ...prev, end_date: undefined }));
                  }
                }}
                placeholder="dd-mm-yyyy"
                minDate={startDateValue}
                error={Boolean(formErrors.end_date)}
              />
              {formErrors.end_date && (
                <p className="mt-1 text-sm text-red-500">{formErrors.end_date}</p>
              )}
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button type="button" onClick={handleSaveCoupon}>
              {editingId ? "Update Coupon" : "Save Coupon"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Created Coupons</CardTitle>
          <CardDescription>Coupons saved locally. Remember to click Save as Draft.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading coupons...
            </div>
          ) : coupons.length === 0 ? (
            <p className="text-sm text-muted-foreground">No coupons added yet.</p>
          ) : (
            <div className="space-y-4">
              {coupons.map((coupon) => {
                const isLocked = (coupon.times_used ?? 0) > 0;
                return (
                  <div key={coupon.tempId} className="rounded-lg border p-4">
                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="secondary" className="font-mono">
                            {coupon.coupon_code}
                          </Badge>
                          <Badge variant={coupon.discount_type === "percentage" ? "default" : "outline"}>
                            {coupon.discount_type === "percentage" ? (
                              <Percent className="mr-1 h-3 w-3" />
                            ) : (
                              <DollarSign className="mr-1 h-3 w-3" />
                            )}
                            {coupon.discount_type === "percentage"
                              ? `${coupon.discount_percent ?? 0}% OFF`
                              : `$${coupon.flat_discount_amount ?? 0} OFF`}
                          </Badge>
                          {isLocked && <Badge variant="outline">Locked (used)</Badge>}
                        </div>
                        <div className="text-sm text-muted-foreground space-y-1">
                          {coupon.discount_type === "percentage" && coupon.max_cap_discount !== null && (
                            <p>Max cap discount: ${coupon.max_cap_discount}</p>
                          )}
                          <p>Max usage: {coupon.max_times_applicable} times</p>
                          <p>
                            Valid: {formatDisplayDate(coupon.start_date)} - {formatDisplayDate(coupon.end_date)}
                          </p>
                          <p>Times used: {coupon.times_used ?? 0}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={isLocked}
                          onClick={() => handleEditCoupon(coupon)}
                        >
                          <Edit2 className="mr-1 h-3 w-3" />
                          Edit
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={isLocked}
                          onClick={() => handleDeleteCoupon(coupon)}
                        >
                          <Trash2 className="mr-1 h-3 w-3" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
});

CouponsStep.displayName = "CouponsStep";

export default CouponsStep;

