namespace ui {

	export interface File {
		name: string;
		contents: string;
	}

	export interface FileUploadProps {
		accept: string;
		label: string;
		callback: (file: File) => void;
		disabled?: boolean;
	}

	export const FileUpload: React.FC<FileUploadProps> = ({ accept, label, callback, disabled }) => {

		const onChange = (e: React.ChangeEvent) => {
			const input = (e.target as HTMLInputElement);

			if (input.files.length > 0) {

				const fr = new FileReader();
				fr.addEventListener("load", (e: ProgressEvent) => {
					callback({
						name: input.files[0].name,
						contents: (fr.result as string)
					});
				});
				fr.readAsText(input.files[0]);
			}
		};

		return (
			<div>
				<label>{label}</label>
				<input type="file" accept={accept} onChange={onChange} disabled={disabled == true}></input>
			</div>
		);
	};
}