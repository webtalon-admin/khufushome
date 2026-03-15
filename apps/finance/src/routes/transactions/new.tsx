import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { TransactionFormDialog } from "../../components/transactions/TransactionFormDialog";
import { createTransaction } from "../../lib/transactions-api";
import type { TransactionInsert } from "../../lib/types";

export const Route = createFileRoute("/transactions/new")({
	component: NewTransactionPage,
});

function NewTransactionPage() {
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const [open, setOpen] = useState(true);

	const createMut = useMutation({
		mutationFn: (data: TransactionInsert) => createTransaction(data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["transactions"] });
			navigate({ to: "/transactions" });
		},
	});

	return (
		<TransactionFormDialog
			open={open}
			onOpenChange={(o) => {
				setOpen(o);
				if (!o) navigate({ to: "/transactions" });
			}}
			onSubmit={(data) => createMut.mutate(data as TransactionInsert)}
			isPending={createMut.isPending}
		/>
	);
}
