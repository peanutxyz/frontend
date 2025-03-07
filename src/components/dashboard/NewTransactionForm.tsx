"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { dashboardApi } from "@/lib/api";

interface Supplier {
  _id: string;
  user: {
    name: string;
  };
}

interface TransactionFormProps {
  onSuccess?: () => void;
}

export function NewTransactionForm({ onSuccess }: TransactionFormProps) {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(true);

  // Manual form state for better control of placeholder behavior
  const [quantityValue, setQuantityValue] = useState<string>('');
  const [lessKiloValue, setLessKiloValue] = useState<string>('');
  const [unitPriceValue, setUnitPriceValue] = useState<string>('');
  
  // Add state for supplier to track it explicitly
  const [selectedSupplier, setSelectedSupplier] = useState<string>('');

  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm({
    defaultValues: {
      supplier: "",
      quantity: null,
      less_kilo: null,
      unit_price: null,
      transaction_date: new Date().toISOString().split('T')[0],
    }
  });

  // Calculate values based on our manual state
  const quantity = parseFloat(quantityValue) || 0;
  const lessKilo = parseFloat(lessKiloValue) || 0;
  const unitPrice = parseFloat(unitPriceValue) || 0;
  const totalKilo = Math.max(0, quantity - lessKilo);
  const totalPrice = totalKilo * unitPrice;

  // Format currency with 2 decimal places
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  useEffect(() => {
    const fetchDropdownData = async () => {
      setIsDataLoading(true);
      try {
        // Fetch suppliers
        console.log("Fetching suppliers...");
        const suppliersResponse = await dashboardApi.getSuppliers();
        console.log("Suppliers response:", suppliersResponse);
       
        // Handle different response structures
        if (suppliersResponse && Array.isArray(suppliersResponse.data)) {
          setSuppliers(suppliersResponse.data);
        } else if (suppliersResponse && Array.isArray(suppliersResponse)) {
          setSuppliers(suppliersResponse);
        } else {
          console.error("Unexpected suppliers data structure:", suppliersResponse);
          setSuppliers([]);
        }
      } catch (error) {
        console.error("Error fetching form data:", error);
        toast.error("Failed to load suppliers. Please check console for details.");
      } finally {
        setIsDataLoading(false);
      }
    };
   
    fetchDropdownData();
  }, []);

  // Reset our custom form state when the form is reset
  const handleReset = () => {
    setQuantityValue('');
    setLessKiloValue('');
    setUnitPriceValue('');
    setSelectedSupplier(''); // Reset the selected supplier
    reset();
  };

  const onSubmit = async (data: any) => {
    try {
      // Validate supplier is selected
      if (!data.supplier && !selectedSupplier) {
        toast.error("Please select a supplier");
        return;
      }

      setIsLoading(true);
     
      // Use the explicitly tracked supplier if available
      const supplierValue = data.supplier || selectedSupplier;
      
      console.log("Form data before submission:", data);
      console.log("Supplier value:", supplierValue);
      
      // Construct submission data with parsed numeric values
      const submitData = {
        ...data,
        supplier: supplierValue, // Ensure supplier is properly set
        quantity: parseFloat(quantityValue) || 0,
        less_kilo: parseFloat(lessKiloValue) || 0,
        unit_price: parseFloat(unitPriceValue) || 0,
        total_kilo: totalKilo,
        total_price: totalPrice,
        total_amount: totalPrice,
        status: "completed"
      };
     
      // Remove paid_amount to allow auto-debit to work
      // (keeping it commented here for reference)
      // paid_amount: totalPrice,
     
      console.log("Submitting transaction data:", submitData);
     
      // Send API request
      const response = await dashboardApi.createTransaction(submitData);
     
      toast.success("Transaction created successfully");
      handleReset();
     
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      console.error("Error creating transaction:", error);
     
      // Enhanced error handling
      if (error.response) {
        console.error("Server response:", error.response.data);
        console.error("Status code:", error.response.status);
        
        // Specifically handle missing fields error
        if (error.response.data?.requiredFields) {
          const missingFields = Object.entries(error.response.data.requiredFields)
            .filter(([_, value]) => value === false)
            .map(([field]) => field);
            
          toast.error(`Missing required fields: ${missingFields.join(', ')}`);
        } else {
          toast.error(`Server error: ${error.response.data?.message || 'Unknown error'}`);
        }
      } else {
        toast.error("Failed to create transaction");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>New Transaction</CardTitle>
        <CardDescription>Create a new copra transaction</CardDescription>
      </CardHeader>
      <CardContent>
        {isDataLoading ? (
          <div className="flex justify-center items-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <form id="transaction-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {/* Supplier Selection */}
              <div className="space-y-2">
                <Label htmlFor="supplier">Supplier</Label>
                <Select
                  onValueChange={(value) => {
                    setValue("supplier", value);
                    setSelectedSupplier(value); // Track supplier in both places
                    console.log("Selected supplier:", value);
                  }}
                  defaultValue={watch("supplier") || ""}
                >
                  <SelectTrigger id="supplier" className="w-full">
                    <SelectValue placeholder="Select a supplier" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.length > 0 ? (
                      suppliers.map((supplier) => (
                        <SelectItem key={supplier._id} value={supplier._id}>
                          {supplier.user?.name || "Unknown Supplier"}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-suppliers" disabled>
                        No suppliers available
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
                {errors.supplier && (
                  <p className="text-sm text-red-500">Supplier is required</p>
                )}
              </div>
             
              {/* Quantity in kg */}
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity (kg)</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="0"
                  step="0.1"
                  value={quantityValue}
                  onChange={(e) => {
                    setQuantityValue(e.target.value);
                  }}
                  className="w-full"
                />
                {errors.quantity && (
                  <p className="text-sm text-red-500">{errors.quantity.message?.toString()}</p>
                )}
              </div>
             
              {/* Less Kilo */}
              <div className="space-y-2">
                <Label htmlFor="less_kilo">Less Kilo</Label>
                <Input
                  id="less_kilo"
                  type="number"
                  min="0"
                  step="0.1"
                  placeholder="Enter less kilo"
                  value={lessKiloValue}
                  onChange={(e) => {
                    setLessKiloValue(e.target.value);
                  }}
                  className="w-full"
                />
                {errors.less_kilo && (
                  <p className="text-sm text-red-500">{errors.less_kilo.message?.toString()}</p>
                )}
              </div>
             
              {/* Unit Price */}
              <div className="space-y-2">
                <Label htmlFor="unit_price">Unit Price</Label>
                <Input
                  id="unit_price"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Enter unit price"
                  value={unitPriceValue}
                  onChange={(e) => {
                    setUnitPriceValue(e.target.value);
                  }}
                  className="w-full"
                />
                {errors.unit_price && (
                  <p className="text-sm text-red-500">{errors.unit_price.message?.toString()}</p>
                )}
              </div>
             
              {/* Transaction Date */}
              <div className="space-y-2">
                <Label htmlFor="transaction_date">Transaction Date</Label>
                <Input
                  id="transaction_date"
                  type="date"
                  {...register("transaction_date", { required: "Date is required" })}
                  className="w-full"
                />
                {errors.transaction_date && (
                  <p className="text-sm text-red-500">{errors.transaction_date.message?.toString()}</p>
                )}
              </div>
            </div>
           
            {/* Summary Section */}
            <div className="bg-muted p-4 rounded-lg mt-4">
              <h3 className="font-medium mb-2">Transaction Summary</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>Gross Weight:</div>
                <div className="text-right">{quantity.toFixed(1)} kg</div>
               
                <div>Less Weight:</div>
                <div className="text-right">{lessKilo.toFixed(1)} kg</div>
               
                <div>Net Weight:</div>
                <div className="text-right">{totalKilo.toFixed(1)} kg</div>
               
                <div>Unit Price:</div>
                <div className="text-right">{formatCurrency(unitPrice)}</div>
               
                <div className="font-semibold">Total Amount:</div>
                <div className="text-right font-semibold">{formatCurrency(totalPrice)}</div>
              </div>
            </div>
          </form>
        )}
      </CardContent>
      <CardFooter className="flex flex-wrap justify-end gap-2 sm:space-x-2">
        <Button
          variant="outline"
          onClick={handleReset}
          className="w-full sm:w-auto"
        >
          Reset
        </Button>
        <Button
          type="submit"
          form="transaction-form"
          disabled={isLoading || isDataLoading}
          className="w-full sm:w-auto"
        >
          {isLoading ? "Creating..." : "Create Transaction"}
        </Button>
      </CardFooter>
    </Card>
  );
}